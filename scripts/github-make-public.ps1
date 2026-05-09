if (-not $env:GITHUB_TOKEN) { Write-Error 'Defina $env:GITHUB_TOKEN'; exit 1 }
$h = @{
  Authorization  = "Bearer $env:GITHUB_TOKEN"
  Accept         = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
  "User-Agent"   = "investiga-deploy"
}
$body = '{"private": false}'
try {
  $r = Invoke-RestMethod -Method Patch -Uri "https://api.github.com/repos/KowalskiKGB/IA-Investigativa" -Headers $h -Body $body
  $r | Select-Object full_name, private, default_branch, html_url
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
    Write-Host "STATUS:" $resp.StatusCode
    Write-Host "BODY:" $sr.ReadToEnd()
  }
}
