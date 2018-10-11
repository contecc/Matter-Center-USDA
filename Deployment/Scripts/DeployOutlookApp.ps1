param            
(                  
    [parameter(Mandatory=$true)]            
    [ValidateNotNullOrEmpty()]             
    [bool] $IsDeploy
)

function addAppToExchange()
{
	param            
    (      
        [parameter(Mandatory=$true)]            
        [ValidateNotNullOrEmpty()]             
        [String] $AppName ,  
              
        [parameter(Mandatory=$true)]            
        [ValidateNotNullOrEmpty()]             
        [String] $filePath ,            
            
        [parameter(Mandatory=$true)]            
        [ValidateNotNullOrEmpty()]             
        $users         
	)	
	try
	{
        if (0 -ne $users.Length) {
			Show-Message -Message "Adding  $AppName App to Exchange..." -Type ([MessageType]::Success)

		    # Work around for installing Exchange app issue
			$Data=Get-Content -Path $filePath -Encoding Byte -ReadCount 0
            $temp = New-App -OrganizationApp -FileData $Data -ProvidedTo SpecificUsers -UserList $users
            Remove-App -Identity $temp.Identity -Confirm:$False -OrganizationApp  
            $temp = New-App -OrganizationApp -FileData $Data -ProvidedTo SpecificUsers -UserList $users -DefaultStateForUser Enabled
			Show-Message -Message "Successfully added $AppName App to Exchange" -Type ([MessageType]::Success)
        }
        else {
			Show-Message -Message "Skipping add $AppName App to Exchange" -Type ( [MessageType]::Warning )
        }
    }
    catch [Exception]
    {
        removeAllApps $AppName
		Show-Message -Message "Failed to add an app" -Type ( [MessageType]::Failure )
        Write-Log $ErrorLogFile $_.Exception.ToString()
    }
}

function removeAppFromExchange()
{	
    param            
    (            
        [parameter(Mandatory=$true)]            
        [ValidateNotNullOrEmpty()]             
        [String] $AppName
    )
	try
	{
        $Apps = Get-App -OrganizationApp
		$IsAppPresent= $False;
        foreach ($App in $Apps)
        {
          if ($App.DisplayName.Equals($AppName))
          {
            $IsAppPresent = $true;
            $ID = $App.AppId
            $Name = $App.DisplayName
			Show-Message -Message "Removing $Name from Exchange..." -Type ( [MessageType]::Warning )
            Remove-App -Identity $ID -Confirm:$False -OrganizationApp
			Show-Message -Message "Removed $Name app from Exchange.." -Type ([MessageType]::Success)
			Show-Message -Message "Successfully Removed Apps from Exchange..." -Type ([MessageType]::Success)
            break
          }

        }
        if(!$IsAppPresent)
        {
			Show-Message -Message "Exchange App not found" -Type ([MessageType]::Success)
        }
    }
    catch [Exception]
    {
		Show-Message -Message "Failed to remove an app" -Type ( [MessageType]::Failure )
        Write-Log $ErrorLogFile $_.Exception.ToString()
    }
}

function removeAllApps()
{
    param            
    (            
        [parameter(Mandatory=$true)]            
        [ValidateNotNullOrEmpty()]             
        $AppDetails
    )

	foreach ($App in $AppDetails)
	{
		removeAppFromExchange -AppName $App
	}
 }

# Get the current directory of the script
Function ScriptRoot {Split-Path $MyInvocation.ScriptName}
$ScriptDirectory = (ScriptRoot)

# Get the parent directory of the script
Function Get-ParentDirectory {Split-Path -Parent(Split-Path $MyInvocation.ScriptName)}
$ParentDirectory = (Get-ParentDirectory)

#Set Excel file path, uncomment below line if you want to use this script separately
#$ExcelFilePath = "$ParentDirectory\MCDeploymentConfig.xlsx"
    
# Set log file path, uncomment below line if you want to use this script separately
#$ErrorLogFile = "$ScriptDirectory\Logs\ErrorLog.txt"

Show-Message -Message "Connecting to Exchange..." -Type ([MessageType]::Success)
if($ExchangeCredential -eq $null) {
	$ExchangeCredential = Get-Credential -Message "Enter credentials to access Exchange server."
}

$appDirectory = Join-Path $DeployPath "Microsoft.Legal.MatterCenter_Outlook\Microsoft.Legal.MatterCenter_OutlookManifest\"
$AppFiles = Get-ChildItem –Path $appDirectory # Get the .app files
$AppNames = "Matter Center" # App Names
$AppNames = $AppNames.Split(';')

Show-Message -Message "Reading inputs from Excel..." -Type ( [MessageType]::Warning )
$ExcelValues = Read-FromExcel $ExcelFilePath "Config" ("ExchangePowerShellURL") $ErrorLogFile
$sheetData = ReadSheet-FromExcel $ExcelFilePath "Create_Group" $ErrorLogFile
$ExcelValues = $ExcelValues.Split(";")
if($ExcelValues.length -le 0)
{
    Write-Log $ErrorLogFile "Error reading values from Excel file. Aborting!"
    return $false
}
$MatterCenterApps = ""
[string]$ExchangeURL = $ExcelValues[0]

for($iIterator=0; $iIterator -le $sheetData.length-1; $iIterator++) {
    if("Matter Center Users" -eq $sheetData[$iIterator][0]) {
        $MatterCenterApps = $sheetData[$iIterator][3];
    }
}

# Prerequisites for On Premise Deployment
# Run Enable-PsRemoting Power shell command on exchange CAS server
# Make Sure On Exchange Server at Virtual Directories, for PowerShell(Default Web Site), Authentication is set to Basic
# Certificate of Exchange server is installed in the client user machine
# New-PSSession: Creates a persistent connection to a local or remote computer

try
{
	Show-Message -Message "Creating new session..." -Type ( [MessageType]::Warning )
    $sessionOption = New-PSSessionOption -SkipRevocationCheck #Does not validate the revocation status of the server certificate
    $session = New-PSSession -ConfigurationName Microsoft.Exchange -ConnectionUri $ExchangeURL -Credential $ExchangeCredential -Authentication Basic –AllowRedirection -SessionOption $sessionOption
    if($null -eq $session)
    {
		Show-Message -Message "Error in creating session... Connection to Exchange failed..." -Type ( [MessageType]::Failure )
        return
    }
    
	Show-Message -Message "Session created..." -Type ([MessageType]::Success)
    
	Show-Message -Message "Connecting to Exchange..." -Type ( [MessageType]::Warning )
    Import-PSSession $session -AllowClobber # Import all the commands
}
catch [Exception]
{
	Show-Message -Message "Unable to connect to Exchange server..." -Type ( [MessageType]::Failure )
    Write-Log $ErrorLogFile $_.Exception.ToString()
}

if ($IsDeploy)
{
  Show-Message -Message "Deploying Apps on Exchange..." -Type ( [MessageType]::Warning )
  if ($null -ne $MatterCenterApps) {
      $filterUser= $MatterCenterApps.TrimEnd(';').Split(';', [System.StringSplitOptions]::RemoveEmptyEntries).Trim();
      addAppToExchange -AppName $AppFiles[0].Name -filePath $AppFiles[0].FullName -users $filterUser;
  }
  else {
	  Show-Message -Message "No users specified for whom Matter 365 App is to be deployed" -Type ( [MessageType]::Warning )
  }
}
else
{
	Show-Message -Message "Removing Apps from Exchange..." -Type ( [MessageType]::Warning )
    removeAllApps $AppNames
   
}

Show-Message -Message "Releasing connection with Exchange server..." -Type ([MessageType]::Success)
Remove-PSSession $session
# SIG # Begin signature block
# MIIFrQYJKoZIhvcNAQcCoIIFnjCCBZoCAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQUtOOkpkhQubrBVLIYUxX1xqF5
# 8WOgggM/MIIDOzCCAiOgAwIBAgIQR7xm3pVqXaNK5GbggpQUMDANBgkqhkiG9w0B
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
# hvcNAQkEMRYEFKCj8uxZfAx9nZ0Mak0e+P+8wrbYMA0GCSqGSIb3DQEBAQUABIIB
# AG563UHOeihQZKAuugQa1WDc3RTm02u3KxlokUuq9bMcDGkQDcH9vqEilUkXcfoH
# Chxumbvz8B6wTsL0dHmkVwPrB/QA98e1z7R3h5j/spZ8MqAuxXmyZTNqW+r5qyDa
# RtRzWEZqb/4hVVENyIhbdiOpIyiVzx32vGVQrqwAMFzV62ApebXTRpss2ma0Jha6
# sO07xdm4AfPxGjd+/DjuDcQa6ZhEowla7zVI+0zItGMkn14g/GsWEqisnSTUr3DU
# q61BSCRzdTw2yfysWH/YCwUpYrJ4EZZGcLPqZnU97/8sxHS8e5XnMuJ3G4m73HQn
# /EZRt8OSzXPuQAlwdK91+jY=
# SIG # End signature block
