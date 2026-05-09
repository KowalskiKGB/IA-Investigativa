# Cria um .env real a partir do exemplo (apenas se não existir)
$envPath = Join-Path $PSScriptRoot ".env"
$examplePath = Join-Path $PSScriptRoot ".env.example"

if (Test-Path $envPath) {
    Write-Host ".env já existe. Não vou sobrescrever." -ForegroundColor Yellow
    exit 0
}

Copy-Item $examplePath $envPath
Write-Host ".env criado. Edite e preencha as chaves." -ForegroundColor Green
