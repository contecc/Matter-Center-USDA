
function Create-ADAppWithPassword{
    [CmdletBinding()]
    Param
    (
        [Parameter(Mandatory=$true)]
		[ValidateNotNullOrEmpty()]
		[string]
		$ADApplicationName,

        [Parameter(Mandatory=$true)]
		[ValidateNotNullOrEmpty()]
		[string]
		$applicationURL,

		[Parameter(Mandatory=$true)]
		[ValidateNotNullOrEmpty()]
		[securestring]
		$password

    )
	
    $azureAdApplication = New-AzureRmADApplication -DisplayName $ADApplicationName -HomePage $applicationURL -IdentifierUris $applicationURL -Password $password
    New-AzureRmADServicePrincipal -ApplicationId $azureAdApplication.ApplicationId
    #New-AzureRmRoleAssignment -RoleDefinitionName Reader -ServicePrincipalName $azureAdApplication.ApplicationId

    return $azureAdApplication
}

function Create-ADAppFromCert
{
    [CmdletBinding()]
    Param
    (
        [Parameter(Mandatory=$true)]
		[ValidateNotNullOrEmpty()]
		[string]
		$ADApplicationName,

        [Parameter(Mandatory=$true)]
		[ValidateNotNullOrEmpty()]
		[string]
		$applicationURL
    
    )


    #$certFileName = "MCWebApp.cer"

	$dnsname =  [string]::format("{0}.azurewebsites.net", $WebAppName)
 
    $crt = New-SelfSignedCertificate -DnsName $dnsname -CertStoreLocation cert:\CurrentUser\My -KeySpec KeyExchange
	$global:thumbPrint = $crt.Thumbprint
    
    #$mypwd = ConvertTo-SecureString -String $creds.Password -Force –AsPlainText
 
    $expfxprt = Export-PfxCertificate -cert $crt -FilePath "$PSScriptRoot\MatterWebApp.pfx" -Password  $creds.Password
 
    Export-Certificate -Cert $crt -FilePath "$PSScriptRoot\MatterWebApp.cer"
 
    New-AzureRmWebAppSSLBinding -ResourceGroupName $ResourceGroupName -WebAppName $WebAppName.ToLowerInvariant() -CertificateFilePath "$PSScriptRoot\MatterWebApp.pfx" -CertificatePassword $creds.GetNetworkCredential().Password -Name $dnsname -SslState Disabled
    
    Write-Host "Certificate uploaded successfully.."

	$credValue = [System.Convert]::ToBase64String($crt.GetRawCertData())
 
    $now = [System.DateTime]::Now
	Write-Host "Creating Azure RM AD Application"

	$adapp = New-AzureRmADApplication -DisplayName $ADApplicationName -HomePage $applicationURL -IdentifierUris $applicationURL -CertValue $credValue -StartDate $crt.NotBefore -EndDate $crt.NotAfter -ReplyUrls $applicationURL
    
	$sp = New-AzureRmADServicePrincipal -ApplicationId $adapp.ApplicationId
	
    Set-AzureRmKeyVaultAccessPolicy -VaultName $vaults_KeyVault_name -ServicePrincipalName $sp.ApplicationId -PermissionsToSecrets all -ResourceGroupName $ResourceGroupName

    return $adapp
}




function Create-KeyVaultSecrets
{  
	param 
	( 
		[Parameter (Mandatory=$true)] 
		[string] $VaultName, 
		[Parameter (Mandatory=$true)] 
		[string] $AdminUserName, 
		[Parameter (Mandatory=$true)] 
		[string] $AdminPassword,
		[Parameter (Mandatory=$true)] 
		[string] $CloudStorageConnectionString,
		[Parameter (Mandatory=$true)] 
		[string] $ClientId,
		#[Parameter (Mandatory=$true)] 
		#[string] $AppKey ,
		[Parameter (Mandatory=$true)] 
		[string] $RedisCacheHostName ,
		[Parameter (Mandatory=$true)] 
		[string] $AppInsightsInstrumentationKey

	) 
 
	$secretvalue = ConvertTo-SecureString $AdminUserName -AsPlainText -Force

	$secret = Set-AzureKeyVaultSecret -VaultName $VaultName -Name 'General-AdminUserName' -SecretValue $secretvalue

 
	$secretvalue = ConvertTo-SecureString $AdminPassword -AsPlainText -Force

	$secret = Set-AzureKeyVaultSecret -VaultName $VaultName -Name 'General-AdminPassword' -SecretValue $secretvalue

	$secretvalue = ConvertTo-SecureString $ClientId -AsPlainText -Force

	$secret = Set-AzureKeyVaultSecret -VaultName $VaultName -Name 'General-ClientId' -SecretValue $secretvalue

	#$secretvalue = ConvertTo-SecureString $AppKey  -AsPlainText -Force

	#$secret = Set-AzureKeyVaultSecret -VaultName $VaultName -Name 'General-AppKey' -SecretValue $secretvalue


	$secretvalue = ConvertTo-SecureString $CloudStorageConnectionString  -AsPlainText -Force

	$secret = Set-AzureKeyVaultSecret -VaultName $VaultName -Name 'General-CloudStorageConnectionString' -SecretValue $secretvalue

	$secretvalue = ConvertTo-SecureString $RedisCacheHostName  -AsPlainText -Force

	$secret = Set-AzureKeyVaultSecret -VaultName $VaultName -Name 'General-RedisCacheHostName' -SecretValue $secretvalue

	$secretvalue = ConvertTo-SecureString $CloudStorageConnectionString  -AsPlainText -Force

	$secret = Set-AzureKeyVaultSecret -VaultName $VaultName -Name 'Data-DefaultConnection-AzureStorageConnectionString' -SecretValue $secretvalue

	$secretvalue = ConvertTo-SecureString $ClientId   -AsPlainText -Force

	$secret = Set-AzureKeyVaultSecret -VaultName $VaultName -Name 'ADAL-clientId' -SecretValue $secretvalue

	$secretvalue = ConvertTo-SecureString $AppInsightsInstrumentationKey  -AsPlainText -Force

	$secret = Set-AzureKeyVaultSecret -VaultName $VaultName -Name 'ApplicationInsights-InstrumentationKey' -SecretValue $secretvalue
}


$appURL = [string]::format("https://{0}.azurewebsites.net", $WebAppName)

#creating the keyVault
Write-Output "Creating Keyvault..."
$kvSettings = New-AzureRmKeyVault -VaultName $vaults_KeyVault_name -ResourceGroupName $ResourceGroupName -Location $ResourceGroupLocation
$kvSettings
$kvADApp = Create-ADAppFromCert -ADApplicationName $ADApp_Name -applicationURL $appURL

Write-Output "END: creating AD app. Return value is ..."

For ($i=0; $i -lt $kvADApp.Length; $i++) {
		if ($kvADApp[$i] -ne $null)
		{
			if (Get-Member -InputObject $kvADApp[$i] -Name 'ApplicationId' -MemberType Properties)
			{
				if( $kvADApp[$i].ApplicationId -ne $null)
				{
					$ADApplicationId = $kvADApp[$i].ApplicationId.Guid.ToString()
				}
			}
		}
    }

	

Write-Output "Writing for AppGuid $ADApplicationId"


$storageAccount_name = $storageAccount_name.ToLower();
$storageConnString =  [string]::format("DefaultEndpointsProtocol=https;AccountName={0};AccountKey={1}", $storageAccount_name, $StorageAccountKey.Item(0).Value)

$AppInsightsApp = Get-AzureRmResource -ResourceType "Microsoft.Insights/components" -ResourceGroupName $ResourceGroupName -ResourceName $components_AppInsights_name
$global:appInsightsId = $AppInsightsApp.Properties.InstrumentationKey
Write-Output "Writing secrets to key vault..."
Create-KeyVaultSecrets -VaultName $vaults_KeyVault_name -AdminUserName $creds.UserName -AdminPassword $creds.Password -CloudStorageConnectionString $storageConnString -ClientId  $ADApplicationId -RedisCacheHostName $redisConnString -AppInsightsInstrumentationKey $AppInsightsApp.Properties.InstrumentationKey 
Write-Host "Updating Matter Web App Settings..."
$appSettings = @{ `
				"General:Tenant" = $global:TenantName; `
				"General:SiteURL" = $SiteURL; `
				"General:CentralRepositoryUrl" = $CentralRepositoryUrl; `
				"General:KeyVaultURI" = $kvSettings.VaultUri; `
				"General:KeyVaultClientID" = $ADApplicationId; `
				"General:KeyVaultCertThumbPrint" = $global:thumbPrint;`
				"Search:SearchResultSourceID" = $SearchResultSourceId.ToString();`
				"WEBSITE_LOAD_CERTIFICATES" = $global:thumbPrint;`
			}
			#Set-AzureWebsite $WebAppName -AppSettings $appSettings -SlotStickyAppSettingNames $appSettings
			Set-AzureRmWebApp -Name $WebAppName -ResourceGroupName $ResourceGroupName -AppSettings $appSettings


Write-Host "Updated Matter Web App Settings"
# SIG # Begin signature block
# MIIFrQYJKoZIhvcNAQcCoIIFnjCCBZoCAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQUsYFQekIf1OJwLcnHW4f0OoGM
# 9pCgggM/MIIDOzCCAiOgAwIBAgIQR7xm3pVqXaNK5GbggpQUMDANBgkqhkiG9w0B
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
# hvcNAQkEMRYEFPg5t/K4YNd8dvnu6vRwjueHST79MA0GCSqGSIb3DQEBAQUABIIB
# AGPZR36FFn2oojKTe3FoHffH9Mr+yJcnrMDw3MOLs0lG+8Xrz8QfkzaPUUaJkRdV
# NuEFcyOhauKDlpVpqBROD5WencIeJXbf+H128M7Ksz4OWuG8i3Ni+1HBufIDnOTl
# IdqTbKqtsaXNAT+qv8PkSKq3tjICTrmSm8o26OuX8nHFIat2e9RUbGF6JTFnr2Vk
# 5f+vjlI58BTKyWutr9TkgRfK2sHA9swiDeiNJ5tmsL964oL7Sqcz+rIAaqyOF0bM
# eEYOjdFwLYzjohL4VUD0tzFimX61lf82Qs7ozWHDiATMyq+xKxYxD0pCpFo+fnOC
# SxXuiZSOFFEEfY3/2JeeTg0=
# SIG # End signature block
