# start.ps1 - Docker Compose para Restaurante E2

Write-Host "=== Eliminando contenedores previos ===" -ForegroundColor Yellow
docker compose down --remove-orphans --volumes 2>$null | Out-Null

Write-Host "=== Iniciando infraestructura ===" -ForegroundColor Green
docker compose up -d

Write-Host "`n=== Esperando servicios (30s) ===" -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n=== Escalando API y Search ===" -ForegroundColor Green
docker compose up -d --scale api=3 --scale search-service=2

Write-Host "`n=== Verificando salud ===" -ForegroundColor Green
$apiOk = $false
$searchOk = $false
$elapsed = 0

while (($elapsed -lt 60) -and (-not ($apiOk -and $searchOk))) {
    if (-not $apiOk) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($r.StatusCode -eq 200) {
                $apiOk = $true
                Write-Host "  API: OK" -ForegroundColor Green
            }
        } catch {}
    }
    if (-not $searchOk) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost/search/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($r.StatusCode -eq 200) {
                $searchOk = $true
                Write-Host "  Search: OK" -ForegroundColor Green
            }
        } catch {}
    }
    if (-not ($apiOk -and $searchOk)) {
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
}

Write-Host "`n=== Estado ===" -ForegroundColor Green
docker compose ps

Write-Host "`n=== URLs ===" -ForegroundColor Cyan
Write-Host "  API:      http://localhost/api/docs/"
Write-Host "  Search:   http://localhost/search/docs/"
Write-Host "  Keycloak: http://localhost:8080"