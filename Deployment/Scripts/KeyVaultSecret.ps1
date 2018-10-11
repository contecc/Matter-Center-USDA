#
# KeyVaultSecret.ps1
#

Param(
    [string] [Parameter(Mandatory=$true, HelpMessage="You can find this value in deployment log file. `
	ex: from VaultUri https://mattercenterw09022324.vault.azure.net mattercenterw09022324 is vaultName ")] $VaultName,
    [string] [Parameter(Mandatory=$true, HelpMessage="This is Azure AD application key. `
	You can get key by following steps in https://azure.microsoft.com/en-us/documentation/articles/resource-group-create-service-principal-portal/#get-client-id-and-authentication-key")] $ADApplicationKey
)

Login-AzureRmAccount 

$secretvalue = ConvertTo-SecureString $ADApplicationKey -AsPlainText -Force
$secret = Set-AzureKeyVaultSecret -VaultName $VaultName -Name 'General-AppKey' -SecretValue $secretvalue 
# SIG # Begin signature block
# MIIFrQYJKoZIhvcNAQcCoIIFnjCCBZoCAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQU2hqR4MW5XYPrC8erb9CmUvj1
# OQagggM/MIIDOzCCAiOgAwIBAgIQR7xm3pVqXaNK5GbggpQUMDANBgkqhkiG9w0B
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
# hvcNAQkEMRYEFE5hzuY+F0Mj5ChlOJvCy+feI3ScMA0GCSqGSIb3DQEBAQUABIIB
# AFQuG18QhEKHodJveqADtKahQ4GZ7Ph29fqfDFmUo2bPQ2e5vle4Syj5B/tYrYg9
# 5+CfF2l5KiKkQ53CRUzMoNT4l0wrrzg++H35Y37RaZTLJ0R1US84tQlf8nl8UdIs
# ZlQ0A+KDlf4OtIk/Uv97dpYUK6P+EOg/tGrWK6QNwPiNG82nME3Lw+oS91EcXNg2
# PdR+jEqe45ePRfC+GNNwUtXz/yj3CBYqczJ+0a7M0qoS0C9gO9vg6b+SnS9OR2dp
# N9RFTLE3RISiWKjIZwEkQuZ+IbsSpxKkT0g6noSpO/VlfkCXFuy44oD2Z/I11v5r
# EnLpH45gaw13JP2MFLq5zl8=
# SIG # End signature block
