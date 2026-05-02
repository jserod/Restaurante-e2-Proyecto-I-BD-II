Write-Host "=== Iniciando infraestructura con Docker Compose ===" -ForegroundColor Green
docker compose up -d

Write-Host "`n=== Esperando que los servicios esten listos ===" -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n=== Aplicando manifests de Kubernetes ===" -ForegroundColor Green
kubectl apply -f k8s/namespace.yml
Start-Sleep -Seconds 5
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/api-deployment.yml
kubectl apply -f k8s/api-service.yml
kubectl apply -f k8s/search-deployment.yml
kubectl apply -f k8s/search-service.yml
kubectl apply -f k8s/nginx-configmap.yml
kubectl apply -f k8s/nginx-deployment.yml
kubectl apply -f k8s/nginx-service.yml

Write-Host "`n=== Esperando que los pods esten listos ===" -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n=== Estado de los pods ===" -ForegroundColor Green
kubectl get pods -n restaurant

Write-Host "`n=== Escalando servicios ===" -ForegroundColor Green
kubectl scale deployment api --replicas=3 -n restaurant
kubectl scale deployment search-service --replicas=3 -n restaurant

Write-Host "`n=== Pods finales ===" -ForegroundColor Green
kubectl get pods -n restaurant -w