Write-Host "=== Eliminando recursos de Kubernetes ===" -ForegroundColor Yellow
kubectl delete namespace restaurant --ignore-not-found=true

Write-Host "`n=== Deteniendo Docker Compose ===" -ForegroundColor Yellow
docker compose down -v

Write-Host "`n=== Todo detenido ===" -ForegroundColor Green