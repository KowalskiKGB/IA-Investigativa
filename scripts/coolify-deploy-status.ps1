param([string]$DeploymentUuid = "m4tmw10vg4kz596jbwe2zihg")
if (-not $env:COOLIFY_TOKEN) { Write-Error 'Defina $env:COOLIFY_TOKEN'; exit 1 }
$h = @{ Authorization = "Bearer $env:COOLIFY_TOKEN" }
$d = Invoke-RestMethod -Uri "http://100.95.227.38:8000/api/v1/deployments/$DeploymentUuid" -Headers $h
"STATUS: $($d.status)"
"STARTED: $($d.started_at)  FINISHED: $($d.finished_at)"
""
"---- last logs ----"
if ($d.logs) {
  try {
    $logs = $d.logs | ConvertFrom-Json
    $logs | Select-Object -Last 40 | ForEach-Object { "[" + $_.type + "] " + $_.output } | Write-Host
  } catch {
    Write-Host ($d.logs.Substring([Math]::Max(0, $d.logs.Length - 4000)))
  }
}
