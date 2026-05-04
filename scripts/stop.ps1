#!/usr/bin/env pwsh
Write-Host "=== Deteniendo todos los servicios ===" -ForegroundColor Yellow
docker compose down --remove-orphans --volumes
Write-Host "=== Servicios detenidos y volúmenes eliminados ===" -ForegroundColor Green