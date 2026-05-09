if (-not $env:COOLIFY_TOKEN) { Write-Error 'Defina $env:COOLIFY_TOKEN'; exit 1 }
$h = @{
  Authorization = "Bearer $env:COOLIFY_TOKEN"
  "Content-Type" = "application/json"
}
$body = @{
  project_uuid             = "ma1duzhcrd068cgmo3q5ic79"
  environment_uuid         = "b12yfbfux3otyqqaknxmwudd"
  environment_name         = "production"
  server_uuid              = "qg8oscokk04ooksgowk4k080"
  git_repository           = "https://github.com/KowalskiKGB/IA-Investigativa"
  git_branch               = "main"
  build_pack               = "dockercompose"
  docker_compose_location  = "/docker-compose.yml"
  ports_exposes            = "3000,8000"
  name                     = "investiga-saas"
  instant_deploy           = $false
} | ConvertTo-Json -Depth 5

try {
  $r = Invoke-RestMethod -Method Post -Uri "http://100.95.227.38:8000/api/v1/applications/public" -Headers $h -Body $body
  $r | ConvertTo-Json -Depth 5
} catch {
  Write-Host "STATUS:" $_.Exception.Response.StatusCode
  Write-Host "BODY:" $_.ErrorDetails.Message
}
