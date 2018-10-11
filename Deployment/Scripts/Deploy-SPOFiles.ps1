# Message Types 
Add-Type -TypeDefinition @"
	public enum MessageType
	{
		Success,
		Warning,
		Failure
	}
"@

# Function to display message on console
Function Show-Message([string] $Message, [string] $Type, [bool] $Newline = $true)
{
	# Set log file path
	$LogFile = "$ScriptDirectory\Logs\Log.txt"
	$timestamp = Get-Date -Format G
	$Message = $timestamp + " - " + $Message
	switch ($Type)
	{
		([MessageType]::Success)
		{ 
		if($Newline) {
			Write-Host $Message -ForegroundColor Green
			}
			else {
			Write-Host $Message -ForegroundColor Green -NoNewline
			}
		}
		([MessageType]::Warning) 
		{ 
			if($Newline) {
				Write-Host $Message -ForegroundColor Yellow     
			}
			else {
				Write-Host $Message -ForegroundColor Yellow -NoNewline
			}
		}
		([MessageType]::Failure)
		{
			if($Newline) { 
				Write-Host $Message -ForegroundColor Red 
			}
			else {
				Write-Host $Message -ForegroundColor Red -NoNewline
			}
		}
		Default { Write-Host $Message -ForegroundColor White }
	}
	# Write into log file
	if(-not [String]::IsNullOrEmpty($Message)) {
		($Message) | Out-File $LogFile -Append
	}
}

# Get the current directory of the script
Function ScriptRoot {Split-Path $MyInvocation.ScriptName}
$ScriptDirectory = (ScriptRoot)


# Set log file path
$LogFile = "$ScriptDirectory\Logs\Log.txt"


# Get the parent directory of the script
Function Get-ParentDirectory {Split-Path -Parent(Split-Path $MyInvocation.ScriptName)}
$ParentDirectory = (Get-ParentDirectory)


#----------------------------------------------
# Include Common functions script
#----------------------------------------------

Show-Message -Message "Adding common library functions" -Type ([MessageType]::Warning)
."$ScriptDirectory\LibraryFunctions.ps1"
Show-Message -Message "Added common library functions" -Type ([MessageType]::Success)


#Create Log folder if not exist
$LogFolder = "$ScriptDirectory\Logs"
If (-not (Test-Path -Path $LogFolder -PathType Container))
{ 
	New-Item -Path $LogFolder -ItemType directory -Force 
}

# Set error log file path
$ErrorLogFile = "$ScriptDirectory\Logs\ErrorLog.txt"

if (!(Test-Path "$ErrorLogFile"))
{
	New-Item -path "$ErrorLogFile" -type "file" -value ""	  
}

# Set log file path
$LogFile = "$ScriptDirectory\Logs\Log.txt"


Function Deploy-SPOFiles
{
    [CmdletBinding(SupportsShouldProcess=$true)]
    Param
    (
	    [Parameter(Mandatory=$true)]
        [String]$WebSiteName,
        [Parameter(Mandatory=$true)]
        [String]$UserName,
	    [Parameter(Mandatory=$true)]
        [String]$PassWord
    )  
	
	cd $HelperPath
	
	##---------------------------------------------------------------------
	## Upload files required for Matter landing page to SharePoint library
	##---------------------------------------------------------------------
	Show-Message -Message "Upload files to SharePoint Library"
	[Environment]::CurrentDirectory = Get-Location
	& "$HelperPath\Microsoft.Legal.MatterCenter.UploadFile.exe" "true" $UserName $Password $WebSiteName $global:appInsightsId

	If ((Get-Content $ErrorLogFile) -ne $Null) {
		Show-Message -Message "Uploading files to SharePoint Library failed" -Type ([MessageType]::Failure)    
		return
	}
	else {
		Show-Message -Message "Completed uploading files to SharePoint library" -Type ([MessageType]::Success)
	}
    
    #---------------------------------------------------------------------
    # Provisioning Web Dashboard page(s) on SharePoint library
    #---------------------------------------------------------------------
    Show-Message -Message "Provisioning Web dashboard"
    & "$HelperPath\Microsoft.Legal.MatterCenter.ProvisionWebDashboard.exe" "true" $Username $Password $WebSiteName

    If ((Get-Content $ErrorLogFile) -ne $Null) {
		Show-Message -Message "Provisioning Web dashboard failed" -Type ([MessageType]::Failure)  
    }
    else {
		Show-Message -Message "Completed Provisioning Web dashboard" -Type ([MessageType]::Success)
    }

	cd $PSScriptRoot
    
}

$UIUrl = [string]::format("https://{0}.azurewebsites.net", $WebAppName)
Deploy-SPOFiles -WebSiteName $UIUrl  -UserName $SPCredential.UserName -PassWord $SPPassword 


#----------------------------------------------
# Update Office, Outlook and SharePoint App schema files
#----------------------------------------------
cd $HelperPath
Show-Message -Message "Step : Update Office, Outlook and SharePoint App schema files"
& "$HelperPath\Microsoft.Legal.MatterCenter.UpdateAppConfig.exe" "1" $SPCredential.UserName $SPPassword $UIUrl

If ((Get-Content $ErrorLogFile) -ne $Null) {
	Show-Message -Message "Updating Office, Outlook and SharePoint App schema files failed" -Type ([MessageType]::Failure)
    return
}
else {
	Show-Message -Message "Completed updating Office, Outlook and SharePoint App schema files" -Type ([MessageType]::Success)
}

cd $PSScriptRoot


#----------------------------------------------
# Add Apps to Office
#----------------------------------------------
Show-Message -Message "Step : Add and install apps to SharePoint and Office"
."$ScriptDirectory\DeployOfficeApp.ps1" -IsDeploy: $true 


    
If ((Get-Content $ErrorLogFile) -ne $Null) {
	Show-Message -Message "Adding and installing apps to  Office failed" -Type ([MessageType]::Failure)
    return
}
else {
	Show-Message -Message "Completed adding and installing apps to Office" -Type ([MessageType]::Success)
}


#----------------------------------------------
# Add Apps to Exchange
#----------------------------------------------
$ExchangeCredential = Get-Credential -Message "Enter credentials to connect with Exchange server."
Show-Message -Message "Step : Add apps to Exchange"
. "$ScriptDirectory\DeployOutlookApp.ps1" -IsDeploy: $true
    
If ((Get-Content $ErrorLogFile) -ne $Null) {
	Show-Message -Message "Adding apps to Exchange failed" -Type ([MessageType]::Failure)
    return
}
else {
	Show-Message -Message "Completed adding apps to Exchange" -Type ([MessageType]::Success)
}


# SIG # Begin signature block
# MIIFrQYJKoZIhvcNAQcCoIIFnjCCBZoCAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQU3DSiBzKsCdV5btW71P4owS7z
# BaygggM/MIIDOzCCAiOgAwIBAgIQR7xm3pVqXaNK5GbggpQUMDANBgkqhkiG9w0B
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
# hvcNAQkEMRYEFGODi7QMNwP2mt/K84IDCK6PLPtkMA0GCSqGSIb3DQEBAQUABIIB
# AFGgxj0EjQwTWZwnHEsABh2eWj4AiAgScpC647rv+jm4oR1flp4S7WbqCtevENXI
# wsBZsP0QsiD0sl/75uLze2Wiiy7+sKswLRJ+wJfr7M+/QMiKarhHXa7OzCDlzIbR
# gdZrZyxDBmE9tFNter6tUc44oLXkIU0nOdQdddtT1DLPEuTyBdLi1RNjmPLjHLdu
# 3aXXss6FxJTw3eVxwx05g5zP3tzdQzZ6MfmYgeGHxJKh/0KV48vU8F8Wag4ld4tl
# jO8SWgHqm2ztq4Amj2ptt07djrAH8Ku2WMAg5JDCa/Az8qo+oTO/9Sv875+G+j+T
# tF6F90E9jTw5D/5ccrSuX50=
# SIG # End signature block
