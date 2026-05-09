if (-not $env:COOLIFY_TOKEN) { Write-Error 'Defina $env:COOLIFY_TOKEN'; exit 1 }
$h = @{
  Authorization  = "Bearer $env:COOLIFY_TOKEN"
  "Content-Type" = "application/json"
}
$body = '{"key":"FOO","value":"bar","is_build_time":false,"is_preview":false,"is_literal":true}'
try {
  Invoke-RestMethod -Method Post -Uri "http://100.95.227.38:8000/api/v1/applications/eg0tvjxgs472y1zl0bb6t56r/envs" -Headers $h -Body $body
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
    Write-Host "STATUS:" $resp.StatusCode
    Write-Host "BODY:" $sr.ReadToEnd()
  } else { Write-Host $_ }
}
