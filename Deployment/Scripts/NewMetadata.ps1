﻿$RootPath = Split-Path(Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$DeployPath = "$RootPath\solution"
$HelperPath = "$RootPath\deployments\scripts\Helper Utilities"
$ExternalPath = "$RootPath\Helper Utilities\External"
$ExcelFilePath = "$RootPath\deployments\MCDeploymentConfig.xlsx"

$SPCredential = Get-Credential -Message "Enter credentials to access SharePoint tenant."
$SPPassword = $SPCredential.GetNetworkCredential().Password
$parentContentTypeName = "Document"
$newContentTypeName = Read-Host "Enter the content type that needs to be created"
$global:contentTypeId = "";
$global:isNewContentTypeExists = $false
#enum for the column types that are being supported
#Add-Type -TypeDefinition @"
#	public enum ColumnType
#	{
#		Text,
#		Boolean,
#		DateTime,
#        Choice,
#        MultiChoice
#	}
#"@

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
        ([MessageType]::Info)
		{
			if($Newline) { 
				Write-Host $Message -ForegroundColor Blue 
			}
			else {
				Write-Host $Message -ForegroundColor Blue -NoNewline
			}
		}
		Default { Write-Host $Message -ForegroundColor White }
	}
	# Write into log file
	if(-not [String]::IsNullOrEmpty($Message)) {
		($Message) | Out-File $LogFile -Append
	}
}

Function Get-ContentTypeId
{
    foreach( $cc in $ctx.Web.ContentTypes)
    {
        if($cc.Name -eq $newContentTypeName)
        {
            Write-Host "New Content Type Name exists. Adding site columns to this content type"
            $global:isNewContentTypeExists = $true
            $global:contentTypeId = $cc.Id.StringValue
            break;
        }   
    }
}

#function for creating a new content type in content type hub site collection
function New-SPOContentType
{
    param(        
        [Parameter(Mandatory=$true,Position=1)] [string]$Description,
        [Parameter(Mandatory=$true,Position=2)] [string]$Name,
        [Parameter(Mandatory=$true,Position=3)] [string]$Group,
        [Parameter(Mandatory=$true,Position=4)] [string]$ParentContentTypeId
    ) 
    $lci =New-Object Microsoft.SharePoint.Client.ContentTypeCreationInformation
    $lci.Description=$Description
    $lci.Name = $Name
    $lci.ParentContentType=$ctx.Web.ContentTypes.GetById($ParentContentTypeId)
    $lci.Group=$Group
    $ContentType = $ctx.Web.ContentTypes.Add($lci)
    $ctx.Load($contentType)    
    try
    {        
       $ctx.ExecuteQuery()      
       Write-Host "Content Type " $Name " has been added to site collection  " $contentTypeHubUrl
    }
    catch [Net.WebException]
    {
       Write-Host $_.Exception.ToString()
    }
} 

#Function to create site columns and add those site columns to the corresponding content type
function Add-SPOSiteColumns
{
    param(
    [Parameter(Mandatory=$true,Position=1)] [string]$columnName,
    [Parameter(Mandatory=$true,Position=2)] [string]$columnType,
    [Parameter(Mandatory=$true,Position=3)] [string]$groupName,
    [Parameter(Position=4)] [string]$subColumnType,
    [Parameter(Position=5)] [string]$values,
    [Parameter(Position=6)] [string]$contentTypeId
    )
    $spWeb = $ctx.Web;
    $fields = $spWeb.Fields;
    $ctx.load($fields)
    try{
        $ctx.executeQuery()            
    }
    catch{            
    }    
    foreach($field in $fields){      
        if ($field.internalname -eq $columnName){            
            Show-Message -Message "Column   $columnName already exists in the site collection. "  -Type ([MessageType]::Warning)  -Newline $true
            $columnExists = 1  
            break
        }
        else{
            $columnExists = 0            
        }       
    }

    #If the column does not exists, create that site column
    if ($columnExists -eq 0){
        Show-Message -Message "Column  $columnName does not exists in the site collection. Adding to the site collection"  -Type ([MessageType]::Info)  -Newline $true
        $fieldAsXML = ''
        #For Text, DateTime and Boolean
        if( $columnType -eq "Text" -or $columnType -eq "DateTime" -or $columnType -eq "Boolean"){
            $fieldAsXML = "<Field Type='$columnType'
            DisplayName='$columnName'
            Name='$columnName'             
            Group='$groupName'/>"
        }

        #For Choice and MultiChoice
        if( $columnType -eq "Choice" -or $columnType -eq "MultiChoice"){
            $choiceValues = ''
            if($values -ne "")
            {
                $choiceValues = $values.Split(",")
                if($columnType -eq "Choice")
                {
                    $fieldAsXML = "<Field Type='$columnType'
                                            DisplayName='$columnName'
                                            Name='$columnName'   
                                            Format='$subColumnType'          
                                            Group='$groupName'>"
                }
                if($columnType -eq "MultiChoice")
                {
                    $fieldAsXML = "<Field Type='$columnType'
                                            DisplayName='$columnName'
                                            Name='$columnName' 
                                            Group='$groupName'>"
                }
                
                $temp = "<CHOICES>"                                                
                foreach( $val in $choiceValues)
                {
                    $temp1 = "$temp1<CHOICE>$val</CHOICE>"
                }
                $temp = "$temp$temp1</CHOICES></Field>"
                $fieldAsXML = "$fieldAsXML $temp"
            }
            else
            {                
                if($columnType -eq "Choice")
                {
                        $fieldAsXML = "<Field Type='$columnType'
                                DisplayName='$columnName'
                                Name='$columnName'   
                                Format='$subColumnType'          
                                Group='$groupName'/>"
                }
                if($columnType -eq "MultiChoice")
                {
                        $fieldAsXML = "<Field Type='$columnType'
                                DisplayName='$columnName'
                                Name='$columnName'                                   
                                Group='$groupName'/>"
                }                 
            }            
        }         
        $fieldOption = [Microsoft.SharePoint.Client.AddFieldOptions]::AddFieldInternalNameHint
        $field = $fields.AddFieldAsXML($fieldAsXML, $true, $fieldOption)
        $ctx.load($field)    
        try{                
            $ctx.executeQuery()   
            Show-Message -Message "Column  $columnName added to the site collection. Adding to the site collection"  -Type ([MessageType]::Success)  -Newline $true
        }
        catch [Exception]{        
            Show-Message -Message "Exception occured when adding Coumn  $columnName  to the site collection. Adding to the site collection"  -Type ([MessageType]::Failure)   -Newline $true            
        }
    }

    Show-Message -Message "Adding column  $columnName  to the content type " $newContentTypeName  -Type ([MessageType]::Info)  -Newline $true
    try
    {
        $field = $fields.GetByInternalNameOrTitle($columnName)
        $flci = new-object Microsoft.SharePoint.Client.FieldLinkCreationInformation
        $flci.Field = $field             
        Write-Host "Writing Content type id " $contentTypeId
        $ct=$spWeb.ContentTypes.GetById($contentTypeId)
        $ct.FieldLinks.Add($flci)
        $ct.Update($true)   
        Show-Message -Message "Successfully added  $columnName  to the content type " $newContentTypeName  -Type ([MessageType]::Success)  -Newline $true
     }
    catch [Exception]{        
        Show-Message -Message "Exception occured when adding Coumn  $columnName  to the content type " $newContentTypeName  -Type ([MessageType]::Failure)   -Newline $true
    }    
}



Function ScriptRoot {Split-Path $MyInvocation.ScriptName}
$ScriptDirectory = (ScriptRoot)

# Set log file path
$LogFile = "$ScriptDirectory\Logs\Log.txt"

# Get the parent directory of the script
Function Get-ParentDirectory {Split-Path -Parent(Split-Path $MyInvocation.ScriptName)}
$ParentDirectory = (Get-ParentDirectory)

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
if (!(Test-Path "$ErrorLogFile"))
{
	New-Item -path "$LogFile" -type "file" -value ""	  
}

Show-Message -Message "Adding common library functions" -Type ([MessageType]::Info)
."$ScriptDirectory\LibraryFunctions.ps1"
Show-Message -Message "Added common library functions" -Type ([MessageType]::Success)
 
Show-Message -Message "Reading Content Type Hub Url" -Type ([MessageType]::Info)
$contentTypeHubUrl = Read-FromExcel $ExcelFilePath "Config" "ContentTypeHubURL" $ErrorLogFile
Write-Host "Content Type Hub Url is " $sheetValue

Write-Host "Reading site columns information from the excel file"
$sheetData = ReadSheet-FromExcel $ExcelFilePath "MatterAdditionalColumns"  $ErrorLogFile


$Assembly = [Reflection.Assembly]::LoadFile(“$ExternalPath\Microsoft.SharePoint.Client.dll”)
$ctx = New-Object Microsoft.SharePoint.Client.ClientContext($contentTypeHubUrl)

if($SPCredential -eq $null)
{
    $SPCredential = Get-Credential -Message "Enter credentials to access SharePoint tenant."
}

$onlinecredential = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($SPCredential.UserName, $SPCredential.Password)     
        

$ctx.Credentials = $onlinecredential
$ctx.Load($ctx.Web);
$ctx.Load($ctx.Web.ContentTypes)
$ctx.ExecuteQuery()


#Get Content Type if it already exists
Get-ContentTypeId
#If the content type does not exists add that content type to Document Content Type
if(!$global:isNewContentTypeExists)
{
    Write-Host $newContentTypeName " content type name does not exists. Creating " $newContentTypeName " in " $contentTypeHubUrl
    foreach( $cc in $ctx.Web.ContentTypes)
    {       
        if($cc.Name -eq $parentContentTypeName)
        {   
            New-SPOContentType -Description "Content type for additional matter types" -Name $newContentTypeName -Group "_MatterCenter" -ParentContentTypeId $cc.Id                     
            break;
        }
    }
}
Get-ContentTypeId



$siteColumnName = "";
$columnType = "";
$subColumnType = "";
$groupName = "";
$defaultValue = "";
for($iIterator=1; $iIterator -le $sheetData.length-1; $iIterator++) {    
        $siteColumnName = $sheetData[$iIterator][0]
        $columnType = $sheetData[$iIterator][1]
        $subColumnType = $sheetData[$iIterator][2]
        $groupName = $sheetData[$iIterator][3]
        $values = $sheetData[$iIterator][4]
        if($columnType -ne "")
        {
            Add-SPOSiteColumns -columnName $siteColumnName -columnType  $columnType -groupName $groupName -subColumnType $subColumnType  -values $values   -contentTypeId $global:contentTypeId     
        } 
}
$spWeb = $ctx.Web;
$fields = $spWeb.Fields;
$ctx.load($fields)
try{
    $ctx.executeQuery()            
}
catch{            
}
# SIG # Begin signature block
# MIIFrQYJKoZIhvcNAQcCoIIFnjCCBZoCAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQUFEKoaAEsgdvGFEnE58/QvKji
# r62gggM/MIIDOzCCAiOgAwIBAgIQR7xm3pVqXaNK5GbggpQUMDANBgkqhkiG9w0B
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
# hvcNAQkEMRYEFAe/dnOdLchFtkvzX6B94AiB9uctMA0GCSqGSIb3DQEBAQUABIIB
# AIh4aycRx5cvU++eYUL7pQcQmyDoiAr0DP6ZdCS3seJuFdo+Sfh+tHglWaEut3iY
# YvLwNxl32NMqodWnVZqIU/sE27wXBkF83OuFGwAt1Hueu0wto9IuY3SPgsmbQ+0N
# 2gR+1IJEf1AZURixQyEASTit2pchQ8RCxdvv7SpkFYRDRlklFjZQsCkXNaNemMuV
# vTyBAt7vxDtZ+S3CDHdmpAvuiK9vE5FfSWkZqH1fwVoDseq41/dSdYaP9JKKSQh+
# KmvpoLI4BsBQJdUomvjWGuMYbQYgoOwE0xG072VGUq6XW5pafipPJP3g8yhHWiri
# IiFCKQwYmBet6+7rJErmVcM=
# SIG # End signature block
