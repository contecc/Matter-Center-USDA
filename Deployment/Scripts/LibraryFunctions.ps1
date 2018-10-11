# Get the current directory of the script
Function ScriptRoot {Split-Path $MyInvocation.ScriptName}
$ScriptDirectory = (ScriptRoot)

# Function is used to read values from Excel file
Function Read-FromExcel([string]$ExcelFilePath,[string] $SheetName, [string[]]$Value, [string]$LogFilePath){
      try
      {
          $temp = ""          
          $Assembly = [Reflection.Assembly]::LoadFile(“$HelperPath\Microsoft.Legal.MatterCenter.Common.dll”)
          $excelValues = [Microsoft.Legal.MatterCenter.Common.ExcelOperations]::ReadFromExcel($ExcelFilePath,$SheetName)
          for($i = 0; $i -lt $Value.Length; $i++){
              if($i -ne 0) {
                   $temp += ";"
               }
              $temp += $excelValues.Item($Value[$i])
          }
          return $temp
      }
      catch
      {
            $ErrorMessage = $Error[0].Exception.ErrorRecord.Exception.Message                             
            Write-Log $LogFilePath $ErrorMessage
            return $false
      }
}

Function ReadSheet-FromExcel([string]$ExcelFilePath,[string] $SheetName, [string]$LogFilePath){
       try{
           $temp = ""          
           $Assembly = [Reflection.Assembly]::LoadFile(“$HelperPath\Microsoft.Legal.MatterCenter.Common.dll”)
           $excelValues = [Microsoft.Legal.MatterCenter.Common.ExcelOperations]::ReadSheet($ExcelFilePath,$SheetName)
           return $excelValues
          }
      catch
      {
            $ErrorMessage = $Error[0].Exception.ErrorRecord.Exception.Message                             
            Write-Log $LogFilePath $ErrorMessage
            return $false
      }
}

# Function is used to write to log file
Function Write-Log() 
{
    param(
        
        [parameter(Mandatory=$false)]            
        [ValidateNotNullOrEmpty()] 
        [string] $ErrorLogFilePath
        
       ,[parameter(Mandatory=$true)]            
        [ValidateNotNullOrEmpty()] 
        [string] $ErrorMessage

        )

    Write-Host $ErrorMessage -ForegroundColor Red
    ($ErrorMessage + " occurred at" + (Get-Date -format "dd-MMM-yyyy HH:mm")) | Out-File $ErrorLogFilePath -Append
}
# SIG # Begin signature block
# MIIFrQYJKoZIhvcNAQcCoIIFnjCCBZoCAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQUMBXHJIitsiMK7aoWhzPVJBgg
# OCOgggM/MIIDOzCCAiOgAwIBAgIQR7xm3pVqXaNK5GbggpQUMDANBgkqhkiG9w0B
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
# hvcNAQkEMRYEFDL3j8Lul1l2R1urMs9/nghuTYcaMA0GCSqGSIb3DQEBAQUABIIB
# ACytciP8JglK2e86TCFeuamoZ7qCj0ZblTyCvTcGlPaXLI9l+gI6LAQH68hCtetH
# Bjj5l1w1ct9+oesxiZqRYbQ4gzkDSEp2gf/QpibsiFK6I+1ZS5CAJfNHTIphkrkf
# ZiLrF6T/gCQktxUdpRfuGvTyG6cxtrcAz+a1QYgYkfSJEW7jpcbWN7MhZhboGloE
# aSodGQeSmqGLdESbvrUl1ADtB/Ryze8AJfbB3g0J0kjCRGy92gTr6G0nnAEcJyJ2
# BL+RmQGuVFt56hK8FuLodag2scsEta+/S/1z4BmD3XZJQujntYGbo5EExzmzpOHC
# ZNOdN1cq2yAhlRUmGjeigxA=
# SIG # End signature block
