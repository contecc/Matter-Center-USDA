Function Import-AzureTableStorage
{
<#
 	.SYNOPSIS
        This is an advanced function which can be used to import the entities of csv file into a table storage.
    .DESCRIPTION
        This is an advanced function which can be used to import the entities of csv file into a table storage.
    .PARAMETER  StorageAccountName
		Spcifies the name of storage account.
    .PARAMETER  TableName
		Specifies the name of table storage.
    .PARAMETER  Path
		Specifies the file path of the csv to be imported. This parameter is required. 

    .EXAMPLE
        C:\PS> Import-AzureTableStorage -StorageAccountName "storageaccount" -TableName SchemasTable2 -Path C:\Tables\SchemasTable.csv

		Successfully Imported entities of table storage named 'SchemasTable'.

        This command shows how to import the entities of the csv file into a table storage.
#>
    [CmdletBinding(SupportsShouldProcess=$true)]
    Param
    (
	[Parameter(Mandatory=$true)]
        [String]$ResourceGroupName,
        [Parameter(Mandatory=$true)]
        [String]$StorageAccountName,
	    [Parameter(Mandatory=$true)]
        [String]$StorageAccountKey,
        [Parameter(Mandatory=$true)]
        [String]$TableName,
        [Parameter(Mandatory=$true)]
        [String]$Path
	
    )

    #Check if Windows Azure PowerShell Module is avaliable
    If((Get-Module -ListAvailable Azure) -eq $null)
    {
        Write-Warning "Windows Azure PowerShell module not found! Please install from http://www.windowsazure.com/en-us/downloads/#cmd-line-tools"
    }
    Else
    {
        If($StorageAccountName)
        {
            Get-AzureRmStorageAccount -ResourceGroupName $ResourceGroupName  -Name $StorageAccountName -ErrorAction SilentlyContinue `
            -ErrorVariable IsExistStorageError | Out-Null

            #Check if storage account is exist
            #If($IsExistStorageError.Exception -eq $null)
            #{
                If($TableName)
                {
                    #Specify a Windows Azure Storage Library path
                    $StorageLibraryPath = "$env:SystemDrive\Program Files\Microsoft SDKs\Azure\.NET SDK\v2.5\ref\Microsoft.WindowsAzure.Storage.dll"

                    #Getting Azure storage account key
                    $StorageAccountName = $StorageAccountName.ToLower();
                    $Creds = New-Object Microsoft.WindowsAzure.Storage.Auth.StorageCredentials("$StorageAccountName","$StorageAccountKey")
                    $CloudStorageAccount = New-Object Microsoft.WindowsAzure.Storage.CloudStorageAccount($Creds, $true)
                    $CloudTableClient = $CloudStorageAccount.CreateCloudTableClient()
                    $Table = $CloudTableClient.GetTableReference($TableName)

                    #Create a Table Storage
                    Write-Verbose "Creating a table storage named '$TableName'."
                    #Try to create table if it does not exist
                    $Table.CreateIfNotExists() | Out-Null

                    If(Test-Path -Path $Path)
                    {
                        $CsvContents = Import-Csv -Path $Path
                        $CsvHeaders = ($CsvContents[0] | Get-Member -MemberType NoteProperty).Name | Where{$_ -ne "RowKey" -and $_ -ne "PartitionKey"}

                        Foreach($CsvContent in $CsvContents)
                        {
                            $PartitionKey = $CsvContent.PartitionKey
                            $RowKey = $CsvContent.RowKey
                            $Entity = New-Object "Microsoft.WindowsAzure.Storage.Table.DynamicTableEntity" "$PartitionKey", "$RowKey"

                            Foreach($CsvHeader in $CsvHeaders)
                            {
                                $Value = $CsvContent.$CsvHeader
                                $Entity.Properties.Add($CsvHeader, $Value)
                            }
                            Write-Verbose "Inserting the entity into table storage."
                            $result = $Table.Execute([Microsoft.WindowsAzure.Storage.Table.TableOperation]::Insert($Entity))
                        }
                        Write-Host "Successfully Imported entities of table storage named '$TableName'."
                    }
                    Else
                    {
                        Write-Warning "The path does not exist, please check it is correct."
                    }
                }
            #}
            #Else
            #{
             #   Write-Warning "Cannot find storage account '$StorageAccountName' because it does not exist. Please make sure thar the name of storage is correct."
            #}
        }
    }
}

Function Create-AzureStorageTable{
	[CmdletBinding(SupportsShouldProcess=$true)]
    Param
    (
	[Parameter(Mandatory=$true)]
        [String]$ResourceGroupName,
        [Parameter(Mandatory=$true)]
        [String]$StorageAccountName,
	    [Parameter(Mandatory=$true)]
        [String]$StorageAccountKey,
        [Parameter(Mandatory=$true)]
        [String]$TableName
    )
	#Getting Azure storage account key
    $StorageAccountName = $StorageAccountName.ToLower();
    $Creds = New-Object Microsoft.WindowsAzure.Storage.Auth.StorageCredentials("$StorageAccountName","$StorageAccountKey")
    $CloudStorageAccount = New-Object Microsoft.WindowsAzure.Storage.CloudStorageAccount($Creds, $true)
    $CloudTableClient = $CloudStorageAccount.CreateCloudTableClient()
    $Table = $CloudTableClient.GetTableReference($TableName)

    #Create a Table Storage
    Write-Verbose "Creating a table storage named '$TableName'."
    #Try to create table if it does not exist
    $Table.CreateIfNotExists() | Out-Null
}


$Path = "$PSScriptRoot\ManageTableStorageWithCsvFile\AzureStorageTable.csv"

Import-AzureTableStorage -ResourceGroupName $ResourceGroupName -StorageAccountName $storageAccount_name -StorageAccountKey $StorageAccountKey.Item(0).Value -TableName "MatterCenterConfiguration" -Path $Path
Create-AzureStorageTable -ResourceGroupName $ResourceGroupName -StorageAccountName $storageAccount_name -StorageAccountKey $StorageAccountKey.Item(0).Value -TableName "ExternalAccessRequests"
Create-AzureStorageTable -ResourceGroupName $ResourceGroupName -StorageAccountName $storageAccount_name -StorageAccountKey $StorageAccountKey.Item(0).Value -TableName "MatterRequests"
Create-AzureStorageTable -ResourceGroupName $ResourceGroupName -StorageAccountName $storageAccount_name -StorageAccountKey $StorageAccountKey.Item(0).Value -TableName "SPOLogTable"

# SIG # Begin signature block
# MIIFrQYJKoZIhvcNAQcCoIIFnjCCBZoCAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQUhi1GgGcAiBwfapDIis42sftk
# SMmgggM/MIIDOzCCAiOgAwIBAgIQR7xm3pVqXaNK5GbggpQUMDANBgkqhkiG9w0B
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
# hvcNAQkEMRYEFLfdtpaT8cKean110o7A8uMG4MmVMA0GCSqGSIb3DQEBAQUABIIB
# AJ2WhPCRIV7xxy7V4eSYGilkcl0bA89JLl2qYqf0Oi5xvtBee9vYr7CtWIuLe66R
# tehNDlIOtzZAL5gcBsd+8kC6cmXclDC4iL2K4QDuTZf4pM+t/lHHAbYoH4c3a0Pw
# Ori8gSwuGZYfXGLnmv8zb3HTnKGOgFjyh/Zm7fGPMYIK/q6Zhgsmbb11SURk5bx6
# TpDPgScbl7+47SDfE3vO6Znd3D5xHIcxIvTVubgredjrJzlhQ5TSewcNiVp1IaCZ
# onsK6BOZwBfYbwdlTgHgbbEurwkksceQO8cR1W3zGO/kniDPFvaVNcAuBIe+MWDm
# rMFT+oc+9asbEEw/nfESIUI=
# SIG # End signature block
