if (-not $env:COOLIFY_TOKEN) { Write-Error 'Defina $env:COOLIFY_TOKEN'; exit 1 }
$h = @{ Authorization = "Bearer $env:COOLIFY_TOKEN" }
$r = Invoke-RestMethod -Method Post -Uri "http://100.95.227.38:8000/api/v1/deploy?uuid=eg0tvjxgs472y1zl0bb6t56r&force=true" -Headers $h
$r | ConvertTo-Json -Depth 5
