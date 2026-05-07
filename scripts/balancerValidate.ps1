param(
    [string]$NginxUrl = "http://localhost",
    [string]$ApiPath = "/_host",
    [string]$SearchPath = "/search/_host",
    [int]$Requests = 20,
    [int]$ExpectedReplicas = 2
)

function Test-LoadBalancer {
    param(
        [string]$ServiceName,
        [string]$Url
    )

    Write-Host "`n=== Probando balanceo: $ServiceName ===" -ForegroundColor Cyan
    Write-Host "URL: $Url"
    Write-Host "Peticiones: $Requests"

    $containers = @{}
    $errors = 0

    for ($i = 1; $i -le $Requests; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $Url -Method GET -TimeoutSec 10 -ErrorAction Stop
            
            $container = $response.container
            $processId = $response.pid
            $service = $response.service

            if (-not $containers.ContainsKey($container)) {
                $containers[$container] = @{
                    ProcessIds = @()
                    Service = $service
                    Count = 0
                }
            }

            $containers[$container].ProcessIds += $processId
            $containers[$container].Count++

            Write-Host "  [$i/$Requests] container=$container pid=$processId service=$service" -ForegroundColor Gray

        } catch {
            $errors++
            Write-Host "  [$i/$Requests] ERROR: $($_.Exception.Message)" -ForegroundColor Red
        }

        # Pequeña pausa para no saturar
        Start-Sleep -Milliseconds 50
    }

    # Resultados
    Write-Host "`n--- Resultados $ServiceName ---" -ForegroundColor Yellow

    $uniqueContainers = $containers.Keys.Count

    Write-Host "Replicas detectadas: $uniqueContainers" -NoNewline
    if ($uniqueContainers -ge $ExpectedReplicas) {
        Write-Host " " -ForegroundColor Green
    } else {
        Write-Host "  (esperadas: $ExpectedReplicas)" -ForegroundColor Red
    }

    Write-Host "`nDistribucion por replica:"
    foreach ($container in $containers.Keys | Sort-Object) {
        $info = $containers[$container]
        $percentage = [math]::Round(($info.Count / $Requests) * 100, 1)
        $uniquePIDs = ($info.ProcessIds | Select-Object -Unique).Count
        Write-Host "  $container : $($info.Count) peticiones ($percentage%) | PIDs unicos: $uniquePIDs | service=$($info.Service)"
    }

    if ($errors -gt 0) {
        Write-Host "`nErrores: $errors/$Requests" -ForegroundColor Red
    }

    # Verificar balanceo aproximado (ninguna réplica debería tener >70%)
    $isBalanced = $true
    foreach ($container in $containers.Keys) {
        $percentage = ($containers[$container].Count / $Requests) * 100
        if ($percentage -gt 70) {
            Write-Host "`n  ALERTA: $container concentra $percentage% de la carga" -ForegroundColor Yellow
            $isBalanced = $false
        }
    }

    if ($isBalanced -and $uniqueContainers -ge $ExpectedReplicas) {
        Write-Host "`n Balanceo de $ServiceName funciona correctamente" -ForegroundColor Green
        return $true
    } else {
        Write-Host "`n Balanceo de $ServiceName NO esta funcionando bien" -ForegroundColor Red
        return $false
    }
}

# ========== EJECUCIÓN ==========

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Verificador de Balanceo Nginx" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Nginx URL: $NginxUrl"
Write-Host "Esperando minimo $ExpectedReplicas replicas por servicio"

$apiOk = Test-LoadBalancer -ServiceName "API" -Url "$NginxUrl$ApiPath"
$searchOk = Test-LoadBalancer -ServiceName "Search" -Url "$NginxUrl$SearchPath"

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "  RESUMEN FINAL" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

if ($apiOk -and $searchOk) {
    Write-Host " Todo funciona correctamente" -ForegroundColor Green
    exit 0
} else {
    Write-Host " Hay problemas con el balanceo" -ForegroundColor Red
    if (-not $apiOk) { Write-Host "   - API no balancea bien" }
    if (-not $searchOk) { Write-Host "   - Search no balancea bien" }
    exit 1
}