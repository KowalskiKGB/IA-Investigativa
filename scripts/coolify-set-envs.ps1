$ErrorActionPreference = "Stop"
$BASE = "http://100.95.227.38:8000/api/v1"
$APP = "eg0tvjxgs472y1zl0bb6t56r"
if (-not $env:COOLIFY_TOKEN) { Write-Error 'Defina $env:COOLIFY_TOKEN'; exit 1 }
$h = @{
  Authorization  = "Bearer $env:COOLIFY_TOKEN"
  "Content-Type" = "application/json"
}

function NewSecret([int]$bytes) {
  $b = New-Object byte[] $bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  -join ($b | ForEach-Object { $_.ToString("x2") })
}

$envs = @(
  @{ key = "POSTGRES_USER";              value = "investiga" }
  @{ key = "POSTGRES_DB";                value = "investiga" }
  @{ key = "POSTGRES_PASSWORD";          value = (NewSecret 24);  is_preview = $false }
  @{ key = "JWT_SECRET";                 value = (NewSecret 32);  is_preview = $false }
  @{ key = "MINIO_ROOT_USER";            value = "investiga" }
  @{ key = "MINIO_ROOT_PASSWORD";        value = (NewSecret 24);  is_preview = $false }
  @{ key = "MINIO_BUCKET";               value = "investiga-docs" }
  @{ key = "APP_ENV";                    value = "production" }
  # FQDNs Coolify-magic (uma URL por linha)
  @{ key = "SERVICE_FQDN_BACKEND_8000";  value = "https://api.investiga.adv.rocketxsistemas.com.br" }
  @{ key = "SERVICE_FQDN_FRONTEND_3000"; value = "https://investiga.adv.rocketxsistemas.com.br" }
  @{ key = "NEXT_PUBLIC_API_URL";        value = "https://api.investiga.adv.rocketxsistemas.com.br" }
)

foreach ($e in $envs) {
  $body = @{
    key                 = $e.key
    value               = $e.value
    is_preview          = $false
    is_literal           = $true
  } | ConvertTo-Json -Depth 4
  try {
    Invoke-RestMethod -Method Post -Uri "$BASE/applications/$APP/envs" -Headers $h -Body $body | Out-Null
    Write-Host "OK   $($e.key)"
  } catch {
    # tenta PATCH update se já existir
    try {
      Invoke-RestMethod -Method Patch -Uri "$BASE/applications/$APP/envs" -Headers $h -Body $body | Out-Null
      Write-Host "UPD  $($e.key)"
    } catch {
      $resp = $_.Exception.Response
      if ($resp) {
        $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
        Write-Host "FAIL $($e.key) [$($resp.StatusCode)]:" $sr.ReadToEnd()
      } else {
        Write-Host "FAIL $($e.key)"
      }
    }
  }
}

# salva segredos localmente para referência
$secretsFile = Join-Path $PSScriptRoot "..\..\.coolify-secrets.txt"
$envs | Where-Object { $_.value -notmatch "investiga|production|https" } | ForEach-Object {
  "$($_.key)=$($_.value)"
} | Out-File -Encoding utf8 (Resolve-Path $secretsFile -ErrorAction SilentlyContinue) 2>$null
Write-Host "`nDone."
