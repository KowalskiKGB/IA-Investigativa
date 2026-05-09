$BASE = "http://100.95.227.38:8000/api/v1"
$APP  = "eg0tvjxgs472y1zl0bb6t56r"
if (-not $env:COOLIFY_TOKEN) { Write-Error 'Defina $env:COOLIFY_TOKEN'; exit 1 }
$h = @{
  Authorization  = "Bearer $env:COOLIFY_TOKEN"
  "Content-Type" = "application/json"
}

# IP público atual do servidor (mesmo dos demais apps Coolify)
$IP = "191.6.127.114"

$updates = @(
  @{ key = "SERVICE_FQDN_BACKEND_8000";  value = "https://api-investiga.$IP.sslip.io" }
  @{ key = "SERVICE_FQDN_FRONTEND_3000"; value = "https://investiga.$IP.sslip.io" }
  @{ key = "NEXT_PUBLIC_API_URL";        value = "https://api-investiga.$IP.sslip.io" }
)

foreach ($e in $updates) {
  $body = @{ key = $e.key; value = $e.value; is_preview = $false; is_literal = $true } | ConvertTo-Json
  try {
    Invoke-RestMethod -Method Patch -Uri "$BASE/applications/$APP/envs" -Headers $h -Body $body | Out-Null
    Write-Host "UPD $($e.key) = $($e.value)"
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
      Write-Host "FAIL $($e.key):" $sr.ReadToEnd()
    }
  }
}
