param
(                  
    [parameter(Mandatory=$true)]            
    [ValidateNotNullOrEmpty()]             
    [bool] $IsDeploy
)

# Online functions
function UninstallSharePointApps()
{
param            
    (                  
        [parameter(Mandatory=$true)]                         
        [ValidateNotNullOrEmpty()]
        [String] $webUrl,

        [parameter(Mandatory=$true)]                         
        [ValidateNotNullOrEmpty()]
        [String] $adminUrl,

        [parameter(Mandatory=$true)]            
        [ValidateNotNullOrEmpty()]             
        [String] $FolderPath
    )

    try
    {
        $context = New-Object Microsoft.SharePoint.Client.ClientContext($webUrl)
		if($SPCredential -eq $null)
        {
            $SPCredential = Get-Credential -Message "Enter SharePoint Credentials"
        }
        $onlinecredential = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($SPCredential.UserName, $SPCredential.Password)
        $context.Credentials = $onlinecredential
        Connect-SPOService -Url $adminurl -Credential $SPCredential
		Show-Message -Message "Proceeding to uninstall the apps" -Type ([MessageType]::Warning)
    
        # Retrieve the specific site before looping through each App
        $web = $context.Web
        $context.Load($web)
        $context.ExecuteQuery()

        $OfficeSolutionList = @("Microsoft.Legal.MatterCenter")

        #Flag to specify the friendly name for copied files
        $FriendlyName = @("Matter Center")
            
        Foreach ($File in (dir $FolderPath))
        {
            # Retrieve the specific file name
            $fileNameWithExtension = split-path $File -Leaf
            $fileName = [System.IO.Path]::GetFileNameWithoutExtension($fileNameWithExtension)

            [int] $position = $OfficeSolutionList.IndexOf($fileName)
            if (-1 -ne $position) {

                $fileName = $FriendlyName[$position]

                $AppInfo = Get-SPOAppInfo -Name $fileName
                foreach($app in $AppInfo)
                {
                    $AppInstance = $web.GetAppInstancesByProductId($app.ProductId)
                    $context.Load($AppInstance)
                    $context.ExecuteQuery()
                    if($AppInstance.Count)
                    {
                        Write-Warning "Retrieving App instances to uninstall"
                        if($AppInstance.Item(0) -ne $null)
                        {
                            $AppInstance.Item(0).Uninstall()
							$context.Load($AppInstance)
                            $context.ExecuteQuery()
                            
							#Check app is uninstalled successfully                                                        
							Show-Message -Message ([String]::Concat("Status: ", $AppInstance.Status)) -Type ([MessageType]::Success)                         
                            while($AppInstance.Status -eq "Uninstalling") {
								Show-Message -Message "." -Type ([MessageType]::Success) -Newline $false
                                Start-Sleep -Seconds 10
                                $context.Load($AppInstance)
                                $context.ExecuteQuery()                                
                            }                            
                            if([String]::IsNullOrEmpty($AppInstance)) {
								Show-Message -Message ([String]::Concat($fileNameWithExtension, " has been uninstalled successfully")) -Type ([MessageType]::Success)
                             }
                             else {                                
                                Write-Log $ErrorLogFile "Failed to uninstall app from SharePoint, kindly uninstall manually (refer to document which contains manual steps)"
                             }
                        }
                    }
                }
            }
        }
    }
    catch [exception]
    {
        Write-Error "Failed to uninstall the app"
        Write-Log $ErrorLogFile $_.Exception.ToString()
    }
}

function loadAndInstallSharePointApps()
{
    param            
    (                  
        [parameter(Mandatory=$true)]                         
        [ValidateNotNullOrEmpty()]
        [String] $webUrl,

        [parameter(Mandatory=$true)]                         
        [ValidateNotNullOrEmpty()]
        [String] $adminUrl,

        [parameter(Mandatory=$true)]            
        [ValidateNotNullOrEmpty()]             
        [String] $FolderPath,

		[parameter(Mandatory=$true)]            
        [ValidateNotNullOrEmpty()]             
        [String] $AppName
    )

    #get the stream from app file
    try
    {
        $context = New-Object Microsoft.SharePoint.Client.ClientContext($webUrl)
        if($SPCredential -eq $null)
        {
            $SPCredential = Get-Credential
        }
        $onlinecredential = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($SPCredential.UserName, $SPCredential.Password)
        $context.Credentials = $onlinecredential
        $sideLoadingEnabled = [Microsoft.SharePoint.Client.appcatalog]::IsAppSideloadingEnabled($context);
        $site = $context.Site;
        $context.ExecuteQuery()
    
        Write-Warning ("Checking for SideLoading feature on site " + $webUrl)
        
        if($sideLoadingEnabled.value -eq $false) 
        {
			Show-Message -Message "SideLoading feature is disabled on site $webUrl" -Type ([MessageType]::Warning)
            $sideLoadingGuid = new-object System.Guid "AE3A1339-61F5-4f8f-81A7-ABD2DA956A7D"
            $site.Features.Add($sideLoadingGuid, $false, [Microsoft.SharePoint.Client.FeatureDefinitionScope]::None);
            $context.ExecuteQuery();
			Show-Message -Message "SideLoading feature enabled on site $webUrl" -Type ([MessageType]::Success)
        }
        else {
			Show-Message -Message "SideLoading feature enabled on site $webUrl" -Type ([MessageType]::Success)
        }
    
		Show-Message -Message "Proceeding to load and install the apps" -Type ([MessageType]::Warning)
        # Load the site context
        $web = $context.Web
        $context.Load($web)
    
        Foreach ($File in (dir $FolderPath))
        {
            if(-1 -ne $appPath.IndexOf($File.FullName))
            {
                $appIoStream = New-Object IO.FileStream($File.FullName ,[System.IO.FileMode]::Open)
                $web.LoadAndInstallApp($appIoStream)
                $context.ExecuteQuery()
                $fileName = split-path $File -Leaf
                $AppInfo = Get-SPOAppInfo -Name $AppName
				#Ensure app is installed on catalog
                Foreach($app in $AppInfo)
                {
                    $AppInstance = $web.GetAppInstancesByProductId($app.ProductId)
                    $context.Load($AppInstance)
                    $context.ExecuteQuery()
					Show-Message -Message ([String]::Concat("Status:", $AppInstance.Status)) -Type ([MessageType]::Success) -Newline $false
                    while($AppInstance.Status -eq "Installing")
                    {                        
					   Show-Message -Message "." -Type ([MessageType]::Success) -Newline $false
                       Start-Sleep -s 10
                       $context.Load($AppInstance)
                       $context.ExecuteQuery()
                    }
                     
                    if($AppInstance.Status -eq "Installed") {
						 Show-Message -Message ([String]::Concat($AppInstance.Title, " has been successfully loaded and installed")) -Type ([MessageType]::Success)
                    }
                    else
                    {                        
				        if($app.Name -eq "Matter Center") 
                        {
                            Write-Log $ErrorLogFile "Failed to install apps to SharePoint."
                        }
                    }
                }
            }
        }

        #Disable Sideloading feature
		Show-Message -Message "Disabling SideLoading feature on site $siteurl" -Type ([MessageType]::Warning)
    
        $sideLoadingEnabled = [Microsoft.SharePoint.Client.appcatalog]::IsAppSideloadingEnabled($context);
        $site = $context.Site;
        $context.ExecuteQuery()
    
        if($sideLoadingEnabled.value -eq $false)
        {
			Show-Message -Message "SideLoading is already disabled on site $webUrl" -Type ([MessageType]::Success)
        }
        else
        {
            $sideLoadingGuid = new-object System.Guid "AE3A1339-61F5-4f8f-81A7-ABD2DA956A7D"
            $site.Features.Remove($sideLoadingGuid, $true);
            $context.ExecuteQuery();
			Show-Message -Message "SideLoading disabled on site $webUrl" -Type ([MessageType]::Success)
        }
    }
    catch [Exception]
    {
		Show-Message -Message "Failed to install the app" -Type ([MessageType]::Failure)
        Write-Log $ErrorLogFile $_.Exception.ToString()
    }
}


# Get the current directory of the script
Function ScriptRoot {Split-Path $MyInvocation.ScriptName}
$ScriptDirectory = (ScriptRoot)

# Get the parent directory of the script
Function Get-ParentDirectory {Split-Path -Parent(Split-Path $MyInvocation.ScriptName)}
$ParentDirectory = (Get-ParentDirectory)

#$RootPath = Split-Path(Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
#$DeployPath = "$RootPath\deployments"


# SharePoint App Folder name
$SharePointAppFolder = "SharePoint App"

# Search Configuration XML path
$SearchConfigurationPath = Resolve-Path "$DeployPath\Static Content\XML\SearchConfiguration.xml"

#Fetch the Folder containing the XML files to add
$FolderPath = Join-Path $DeployPath $SharePointAppFolder

#Set Excel file path, uncomment below line if you want to use this script separately
#$ExcelFilePath = "$DeployPath\MCDeploymentConfig.xlsx"
    
# Set log file path, uncomment below line if you want to use this script separately
# $ErrorLogFile = "$ScriptDirectory\ErrorLog.txt"

# Set the helper files folder path, uncomment below line if you want to use this script separately
# $HelperPath = "$ScriptDirectory\Helper Utilities"

#Fetch the Catalog URL from the Excel File
Show-Message -Message "Fetching the Catalog URL from the Configuration File" -Type ([MessageType]::Warning)
$ExcelValues = Read-FromExcel $ExcelFilePath "Config" ("CatalogSiteURL", "TenantAdminURL") $ErrorLogFile
$ExcelValues = $ExcelValues.Split(";")
if($ExcelValues.length -le 0)
{
    Write-Log $ErrorLogFile "Error reading values from Excel file. Aborting!"
    return $false
}
$webUrl = $ExcelValues[0]
$adminUrl = $ExcelValues[1]
$AppName = @("Matter Center")
$AppPkgName = @("Microsoft.Legal.MatterCenter.app")

#On Premise Variables
$Source = "ObjectModel"

#Get the app names
$appPath = ''
$Files = dir $FolderPath
for ($iIterator = 0; $iIterator -lt $AppPkgName.Length; $iIterator++)
{
    for($id = 0; $id -lt $Files.Length; $id++)
    {
       if($Files[$id].FullName.Contains($AppPkgName[$iIterator]))
        {
            $appPath = $appPath + ',' + $Files[$id].FullName
            break
        }
    }
}
$appPath = $appPath.Trim(',').Split(',')

if($webUrl -ne $null)
{
	Show-Message -Message "Successfully retrieved the Catalog URL" -Type ([MessageType]::Success)
}

#Fetch the Admin URL from the Excel File
Show-Message -Message "Fetching the Admin URL from the Configuration File" -Type ([MessageType]::Warning)

if($adminUrl -ne $null)
{
	Show-Message -Message "Successfully retrieved the Admin URL" -Type ([MessageType]::Success)
}

Show-Message -Message "Proceeding to load and install the apps" -Type ([MessageType]::Warning)


if ($IsDeploy) {
    #Load and Install Apps
    loadAndInstallSharePointApps -webUrl $webUrl -adminUrl $adminUrl -FolderPath $FolderPath -AppName $AppName[0]
	If ((Get-Content $ErrorLogFile) -eq $Null) {            
		& "$HelperPath\Microsoft.Legal.MatterCenter.UpdateListPermissions" $Username $Password
    }  
}
else
{
    #Uninstall Apps
    UninstallSharePointApps -webUrl $webUrl -adminUrl $adminUrl -FolderPath $FolderPath 
}

# SIG # Begin signature block
# MIIFrQYJKoZIhvcNAQcCoIIFnjCCBZoCAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQUEjz09DdvRU4/tPNYDZialYiw
# 8TWgggM/MIIDOzCCAiOgAwIBAgIQR7xm3pVqXaNK5GbggpQUMDANBgkqhkiG9w0B
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
# hvcNAQkEMRYEFBV2svwBYbFMfAFZ3w70XDw2+Of6MA0GCSqGSIb3DQEBAQUABIIB
# AHh17jcyFXdbAn6RDCGHqjyykrp0Ud1JxXMMlJyAZJXPQrAkZMu0GNiNC3/9761x
# 8riiyuO2vyFQdcBG4lAgRnZvFxiCvbW4twopAlzk4v4GOHXZ05slwj7J+88K16+/
# iORPg3A00rW2+UEkv59EGpprm1fMVwQEQmt1gNg1HBCwofuBUzyKMNGF8+R9zf+n
# Q7YB30JKYOsueh8o9z0j7zYvalV0Sf/UFpmp2pKs8ynVJJl24TW7xQo0lgvxedEn
# emMfz7GnHd2OtimQrxpOyHpmEPMZz6x1onjl1NzplC8EYcUl4HYrMTLtY+J3G90j
# 1qslA4t9xfZF1HMYQcexngs=
# SIG # End signature block
