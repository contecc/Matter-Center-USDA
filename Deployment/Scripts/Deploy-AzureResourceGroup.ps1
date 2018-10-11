<#
.SYNOPSIS
    .
.DESCRIPTION
    .
.PARAMETER Path
    The path to the .
.PARAMETER LiteralPath
    Specifies a path to one or more locations. Unlike Path, the value of 
    LiteralPath is used exactly as it is typed. No characters are interpreted 
    as wildcards. If the path includes escape characters, enclose it in single
    quotation marks. Single quotation marks tell Windows PowerShell not to 
    interpret any characters as escape sequences.
.EXAMPLE
    C:\PS> 
    <Description of example>
.NOTES
    Author: Matter Center Core Team
    Date:   Sept 02, 2016    
#>

Param(
    [string] [Parameter(Mandatory=$true, HelpMessage="ex: west us")] $ResourceGroupLocation,
    [string] [Parameter(Mandatory=$true, HelpMessage="ex: MatterCenterRG")] $ResourceGroupName = 'MatterCenterRG',
    [string] [Parameter(Mandatory=$true, HelpMessage="ex: MatterCenterWeb")] $WebAppName = 'MatterCenterWeb',
	[string] [Parameter(Mandatory=$true, HelpMessage="Provide the catalog site url you used during sharepoint site deployment. `
	it will be https://<tenantname>.sharepoinT.com/sites/catalog if you didnt change default catalog site.")] $CentralRepositoryUrl,
	
    [switch] $UploadArtifacts,
    [string] $StorageAccountName,
    [string] $StorageAccountResourceGroupName, 
    [string] $StorageContainerName = $ResourceGroupName.ToLowerInvariant() + '-stageartifacts',
    [string] $TemplateFile = '..\Templates\template.json',
    [string] $TemplateParametersFile = '..\Templates\template.parameters.json',
    [string] $ArtifactStagingDirectory = '..\bin\Debug\staging',
    [string] $AzCopyPath = '..\Tools\AzCopy.exe',
    [string] $DSCSourceFolder = '..\DSC'
)
$logFileName = "MCDeploy"+(Get-Date).ToString('yyyyMMdd-HHmmss')+".log"
Start-Transcript -path $logFileName
$WebAppName = $WebAppName + ((Get-Date).ToUniversalTime()).ToString('MMddHHmm')
if($WebAppName.Length -gt 60)
{
	$WebAppName =  $WebAppName.Substring(0,60)
}

#Get sharepoint site root url from respository
$CentralRepositoryUrl = $CentralRepositoryUrl.ToLower()
$indexOfSPO = $CentralRepositoryUrl.IndexOf(".com")
$SiteURL = $CentralRepositoryUrl.Substring(0, $indexOfSPO + 4)

$Redis_cache_name = $WebAppName+"RedisCache"
$autoscalesettings_name = $WebAppName+"ScaleSettings"
$components_AppInsights_name = $WebAppName+"AppInsights"
if($WebAppName.Length -gt 24)
{
	$vaults_KeyVault_name = $WebAppName.Substring(0,24)
	$storageAccount_name = $WebAppName.Substring(0,24)
}
else
{
	$vaults_KeyVault_name = $WebAppName
	$storageAccount_name = $WebAppName
}
$serverfarms_WebPlan_name = $WebAppName+"WebPlan"
$ADApp_Name = $WebAppName+"ADApp"
$global:thumbPrint = ""
$global:appInsightsId = ""
$storageAccount_name 
$ADApplicationId = ""
Write-Output "Reading from template.parameters.json file..."
$params = ConvertFrom-Json -InputObject (Get-Content -Path $TemplateParametersFile -Raw)
$params.parameters.webSite_name.value = $WebAppName
Set-Content -Path $TemplateParametersFile -Value (ConvertTo-Json -InputObject $params -Depth 3)


Import-Module Azure -ErrorAction SilentlyContinue
#Add-AzureAccount
$subsc = Login-AzureRmAccount
$global:TenantName = $subsc.Context.Tenant.Directory

try {
 #   [Microsoft.Azure.Common.Authentication.AzureSession]::ClientFactory.AddUserAgent("VSAzureTools-$UI$($host.name)".replace(" ","_"), "2.8")
} catch { }

Set-StrictMode -Version 3

$OptionalParameters = New-Object -TypeName Hashtable
$TemplateFile = [System.IO.Path]::Combine($PSScriptRoot, $TemplateFile)
$TemplateParametersFile = [System.IO.Path]::Combine($PSScriptRoot, $TemplateParametersFile)

if ($UploadArtifacts) {
    # Convert relative paths to absolute paths if needed
    $AzCopyPath = [System.IO.Path]::Combine($PSScriptRoot, $AzCopyPath)
    $ArtifactStagingDirectory = [System.IO.Path]::Combine($PSScriptRoot, $ArtifactStagingDirectory)
    $DSCSourceFolder = [System.IO.Path]::Combine($PSScriptRoot, $DSCSourceFolder)

    Set-Variable ArtifactsLocationName '_artifactsLocation' -Option ReadOnly -Force
    Set-Variable ArtifactsLocationSasTokenName '_artifactsLocationSasToken' -Option ReadOnly -Force

    $OptionalParameters.Add($ArtifactsLocationName, $null)
    $OptionalParameters.Add($ArtifactsLocationSasTokenName, $null)

    # Parse the parameter file and update the values of artifacts location and artifacts location SAS token if they are present
    $JsonContent = Get-Content $TemplateParametersFile -Raw | ConvertFrom-Json
    $JsonParameters = $JsonContent | Get-Member -Type NoteProperty | Where-Object {$_.Name -eq "parameters"}

    if ($JsonParameters -eq $null) {
        $JsonParameters = $JsonContent
    }
    else {
        $JsonParameters = $JsonContent.parameters
    }

    $JsonParameters | Get-Member -Type NoteProperty | ForEach-Object {
        $ParameterValue = $JsonParameters | Select-Object -ExpandProperty $_.Name

        if ($_.Name -eq $ArtifactsLocationName -or $_.Name -eq $ArtifactsLocationSasTokenName) {
            $OptionalParameters[$_.Name] = $ParameterValue.value
        }
    }

    $StorageAccountKey = (Get-AzureRmStorageAccountKey -ResourceGroupName $StorageAccountResourceGroupName -Name $StorageAccountName).Key1

    $StorageAccountContext = (Get-AzureRmStorageAccount -ResourceGroupName $StorageAccountResourceGroupName -Name $StorageAccountName).Context

    # Create DSC configuration archive
    if (Test-Path $DSCSourceFolder) {
        Add-Type -Assembly System.IO.Compression.FileSystem
        $ArchiveFile = Join-Path $ArtifactStagingDirectory "dsc.zip"
        Remove-Item -Path $ArchiveFile -ErrorAction SilentlyContinue
        [System.IO.Compression.ZipFile]::CreateFromDirectory($DSCSourceFolder, $ArchiveFile)
    }

    # Generate the value for artifacts location if it is not provided in the parameter file
    $ArtifactsLocation = $OptionalParameters[$ArtifactsLocationName]
    if ($ArtifactsLocation -eq $null) {
        $ArtifactsLocation = $StorageAccountContext.BlobEndPoint + $StorageContainerName
        $OptionalParameters[$ArtifactsLocationName] = $ArtifactsLocation
    }

    # Use AzCopy to copy files from the local storage drop path to the storage account container
    & $AzCopyPath """$ArtifactStagingDirectory""", $ArtifactsLocation, "/DestKey:$StorageAccountKey", "/S", "/Y", "/Z:$env:LocalAppData\Microsoft\Azure\AzCopy\$ResourceGroupName"
    if ($LASTEXITCODE -ne 0) { return }

    # Generate the value for artifacts location SAS token if it is not provided in the parameter file
    $ArtifactsLocationSasToken = $OptionalParameters[$ArtifactsLocationSasTokenName]
    if ($ArtifactsLocationSasToken -eq $null) {
        # Create a SAS token for the storage container - this gives temporary read-only access to the container
        $ArtifactsLocationSasToken = New-AzureStorageContainerSASToken -Container $StorageContainerName -Context $StorageAccountContext -Permission r -ExpiryTime (Get-Date).AddHours(4)
        $ArtifactsLocationSasToken = ConvertTo-SecureString $ArtifactsLocationSasToken -AsPlainText -Force
        $OptionalParameters[$ArtifactsLocationSasTokenName] = $ArtifactsLocationSasToken
    }
}

# Create or update the resource group using the specified template file and template parameters file
New-AzureRmResourceGroup -Name $ResourceGroupName -Location $ResourceGroupLocation -Verbose -Force -ErrorAction Stop 

New-AzureRmResourceGroupDeployment -Name ((Get-ChildItem $TemplateFile).BaseName + '-' + ((Get-Date).ToUniversalTime()).ToString('MMdd-HHmm')) `
                                   -ResourceGroupName $ResourceGroupName `
                                   -TemplateFile $TemplateFile `
                                   -TemplateParameterFile $TemplateParametersFile `
                                   @OptionalParameters `
                                   -Force -Verbose

$creds = Get-Credential -Message "Enter credentials for connecting to Azure"

Write-Output "Getting the storage key to write to key vault..."
$StorageAccountKey = Get-AzureRmStorageAccountKey -Name $storageAccount_name -ResourceGroupName $ResourceGroupName

#Write-Output "Getting the Redis connection string"
$RedisCacheName = (Get-AzureRmRedisCache -Name $Redis_cache_name -ResourceGroupName $ResourceGroupName )[0].HostName
$RedisCachePort = (Get-AzureRmRedisCache -Name $Redis_cache_name -ResourceGroupName $ResourceGroupName )[0].Port
$RedisCacheKey = (Get-AzureRmRedisCacheKey -Name $Redis_cache_name -ResourceGroupName $ResourceGroupName ).PrimaryKey
$redisConnString = [string]::format("{0}:{1},password={2},ssl=True,abortConnect=False", $RedisCacheName, $RedisCachePort,  $RedisCacheKey)


# Set helper utilities folder path
$RootPath = Split-Path(Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$DeployPath = "$RootPath\deployments"
$HelperPath = "$RootPath\deployments\scripts\Helper Utilities"
$ExcelFilePath = "$RootPath\deployments\MCDeploymentConfig.xlsx"
$SPCredential = Get-Credential -Message "Enter credentials to access SharePoint tenant."
$SPPassword = $SPCredential.GetNetworkCredential().Password

cd $HelperPath
Write-Output "Getting the result source ID..."
$SearchResultSourceId = & ".\Microsoft.Legal.MatterCenter.UpdateAppConfig.exe" "4" $SPCredential.UserName $SPPassword
$SearchResultSourceId.ToString()
cd $PSScriptRoot


$custScriptFile = [System.IO.Path]::Combine($PSScriptRoot, 'KeyVault-Config.ps1')
Invoke-Expression $custScriptFile 

$storageScriptFile = [System.IO.Path]::Combine($PSScriptRoot, 'Create-AzureStorageTable.ps1')
Invoke-Expression $storageScriptFile

$webJobScriptFile = [System.IO.Path]::Combine($PSScriptRoot, 'Create-MatterCenterWebJob.ps1')
Invoke-Expression $webJobScriptFile

$spoDeployFiles = [System.IO.Path]::Combine($PSScriptRoot, 'Deploy-SPOFiles.ps1')
Invoke-Expression $spoDeployFiles

Stop-Transcript 
# SIG # Begin signature block
# MIIFrQYJKoZIhvcNAQcCoIIFnjCCBZoCAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQU6LYVOGoAz3inmZLHTAsNfdol
# jQagggM/MIIDOzCCAiOgAwIBAgIQR7xm3pVqXaNK5GbggpQUMDANBgkqhkiG9w0B
# AQsFADAjMSEwHwYDVQQDDBhjb2Rlc2lnbmluZy5mYWJyaWthbS5jb20wHhcNMTgw
# ODA2MTkyNTU4WhcNMTkwODA2MTk0NTU4WjAjMSEwHwYDVQQDDBhjb2Rlc2lnbmlu
# Zy5mYWJyaWthbS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDE
# da0QBRq8OOm80xnl4+BKY1XKWeNkU9L+AN55v3/LvvRaLqv8g0gbP2CDXChi3jY5
# tgp3ppytrsZWMQvPb3oN6sI6JWDBcNME7spnHjNYDgPBSZ1xvm+/mV6Xl99WEk2A
# 2+PtLJmxHkjjnOUCrp49gZYlIPI7doiP0bpRKqU0gtyVUjWBShcFKgwrSjAqsaBA
# rZK1FO2uFIpu0KLHnXtO8KLecq5svcg9PyfVfJjgX9/e1gNFEukrf4F0vQZuHHoN
# A8UF8gBGKdRqwWe8bexf52I2kVf2i4+Q0zHoaKAknlvSwxayskDLGJnBnPy+UJVN
# SZwsVSaYbcafdHPeLOgpAgMBAAGjazBpMA4GA1UdDwEB/wQEAwIHgDATBgNVHSUE
# DDAKBggrBgEFBQcDAzAjBgNVHREEHDAaghhjb2Rlc2lnbmluZy5mYWJyaWthbS5j
# b20wHQYDVR0OBBYEFD6trmcRzunL/jUgHokPRrm4+PlWMA0GCSqGSIb3DQEBCwUA
# A4IBAQAI9l5icN9zhFhQKe0p3UoFrv/KMiwoSmEnx8bFm6cZxXaxxWXF6UdmJx/Y
# ORHCTfUpr++00bLfJfLvNAS4+eI6+euueP6yRAmFRjWLdbYOEErwq7bxI3KstNRH
# rOd4b9Gv716DhPMA3gkrr8GEPZ1qPgu2GQ9DJzzIKkJN6mm+a32hwwzS6NhaVWPm
# J+q4WfGzJyRLiASxtg9YNgpihDNyMgH4sBPRi0i89pEUC4KH+zJjSYr2ZP4d9xj0
# FlfE72XMSdDVvyc8u/5jMWEcGj44f4AlorPZ+bjwZCV7W10kklx/c9kkGrNy3i0V
# cFDyw0AYDDcqE2HvE90YHhRGHWAaMYIB2DCCAdQCAQEwNzAjMSEwHwYDVQQDDBhj
# b2Rlc2lnbmluZy5mYWJyaWthbS5jb20CEEe8Zt6Val2jSuRm4IKUFDAwCQYFKw4D
# AhoFAKB4MBgGCisGAQQBgjcCAQwxCjAIoAKAAKECgAAwGQYJKoZIhvcNAQkDMQwG
# CisGAQQBgjcCAQQwHAYKKwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUwIwYJKoZI
# hvcNAQkEMRYEFLQrkhzOJ4umXlycGiiyGy699pATMA0GCSqGSIb3DQEBAQUABIIB
# ALI9/NQ9hzkdjgXnT69jQWOV/+8dnSeEOPrY5IR22NL9JNbAKnLW7FxuXBGUGIf0
# aEnjRyCD4/5Tr++KCGlHD5mc6M9P6QvtJhHBIxkhW8qLwme5N/Op8kKPQhB2r2/N
# 43NWipnWKoqtTHb5hn4HPS9EsgF6qxXB2M3rxtMTuOcmIsXIgu7t9UjphqYbmNDb
# 9UI/BvN3ilh49GApai3BowWoVD2QJPG8aZeRQK3INiaHDJJUAXu4GWdWIX28hGXz
# AUDSMUYLL07AHya+mk4j94Puq03A+Ibxb6SdYCwuZS+1EIIBORCEtFSkaehIgwE5
# mfq4RNotPEQMW1DReKuhZng=
# SIG # End signature block
