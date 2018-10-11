Function Create-MatterCenterWebJob
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
	Add-AzureAccount

	Select-AzureSubscription

	"Creating web job..."
    $webJobBinariesPath = "$PSScriptRoot\WebJob\MatterCenterWebJobs.zip"
	$jobId = [GUID]::NewGuid()
	$job = New-AzureWebsiteJob -Name $WebSiteName `
							-JobName "MatterCenterWebJobs" `
							-JobType Continuous `
							-JobFile $webJobBinariesPath;
	$jobCollection = New-AzureSchedulerJobCollection `
					-Location 'West US' `
					-JobCollectionName $jobId;
	$authPair = "$($UserName):$($PassWord)";
	$pairBytes = [System.Text.Encoding]::UTF8.GetBytes($authPair);
	$encodedPair = [System.Convert]::ToBase64String($pairBytes);
	New-AzureSchedulerHttpJob `
	  -JobCollectionName $jobCollection[0].JobCollectionName `
	  -JobName "test" `
	  -Method POST `
	  -URI "$($job.Url)\run" `
	  -Location 'West US' `
	  -StartTime "2014-01-01" `
	  -Interval 1 `
	  -Frequency Minute `
	  -EndTime "2015-01-01" `
	  -Headers @{ `
		"Content-Type" = "text/plain"; `
		"Authorization" = "Basic $encodedPair"; `
	  };
    "Web job creation completed..."
}

Create-MatterCenterWebJob -WebSiteName $WebAppName  -UserName $creds.UserName -PassWord $creds.Password 
# SIG # Begin signature block
# MIIFrQYJKoZIhvcNAQcCoIIFnjCCBZoCAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQUgC0oXX4kZfJ2VwyCCY1QwYWO
# Yi2gggM/MIIDOzCCAiOgAwIBAgIQR7xm3pVqXaNK5GbggpQUMDANBgkqhkiG9w0B
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
# hvcNAQkEMRYEFCebglyyYbLEXegcw3Fo0wDVCGM+MA0GCSqGSIb3DQEBAQUABIIB
# AJP7EbTjEgiYCokUj3ypfsM6LeL8S2/nvDcos/Htt/cqNSE0eyw+0zX+/iyLtMuY
# v0nwHw80Nmn0n8yZfvyaz0RyOee2qz2nZaF04jbN+dFbsbRC7f0eTKkY7M/LEEeL
# 4x54QVdKI2xeNSfN+a2dsoMc65GS7Q5qH6ADEoJdARWZO3oE7Mp+0EA6Y3xt6n3A
# ix9V7d5aKPUqeR/9XbhUncpFgzjYqTLuhBcLUfv90jqb8FkjT2LTX/OqOnkfu/S2
# Vc7C7GI+NTFFhm11Ky9s1r84KJ58dm759t3Udf036akbqgtuzQtrR/nIJ1Gbhp/R
# MRCs7XD5AZXaXzf8Q7Zr8+8=
# SIG # End signature block
