# =========================================
#   VALIDACION AVANZADA DE BALANCEADOR
# =========================================

$API_URL    = "http://localhost/_host"
$SEARCH_URL = "http://localhost/search/_host"

$TOTAL_REQUESTS = 200
$PARALLELISM    = 20

function Test-Balancing {
    param(
        [string]$Url,
        [string]$ServiceName
    )

    Write-Host ""
    Write-Host "Probando $ServiceName ($TOTAL_REQUESTS requests, paralelismo=$PARALLELISM)" -ForegroundColor Cyan

    # Crear pool de runspaces (threads)
    $runspacePool = [runspacefactory]::CreateRunspacePool(1, $PARALLELISM)
    $runspacePool.Open()

    $runspaces = @()

    # Script que ejecuta cada thread
    $scriptBlock = {
        param($TargetUrl)
        try {
            $response = Invoke-RestMethod -Uri $TargetUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
            if ($response.container) {
                return $response.container
            } else {
                return "unknown"
            }
        } catch {
            return "error"
        }
    }

    # Lanzar todos los trabajos
    for ($i = 1; $i -le $TOTAL_REQUESTS; $i++) {
        $powerShell = [powershell]::Create().AddScript($scriptBlock).AddArgument($Url)
        $powerShell.RunspacePool = $runspacePool

        $runspaces += @{
            Pipe   = $powerShell
            Status = $powerShell.BeginInvoke()
        }
    }

    # Recolectar resultados
    $results = @()
    foreach ($rs in $runspaces) {
        $results += $rs.Pipe.EndInvoke($rs.Status)
        $rs.Pipe.Dispose()
    }

    $runspacePool.Close()
    $runspacePool.Dispose()

    # Contar resultados
    $containers = @{}
    foreach ($r in $results) {
        if ($containers.ContainsKey($r)) {
            $containers[$r]++
        } else {
            $containers[$r] = 1
        }
    }

    Write-Host ""
    Write-Host "Distribucion:" -ForegroundColor Yellow
    Write-Host "---------------------------------"

    $percentages = @()

    if ($containers.Count -eq 0) {
        Write-Host "  No se recibieron respuestas validas" -ForegroundColor Red
        return
    }

    foreach ($container in $containers.Keys | Sort-Object) {
        $count = $containers[$container]
        $percentage = ($count / $TOTAL_REQUESTS) * 100
        $percentages += $percentage

        $barLen = [math]::Min([math]::Round($percentage), 50)
        $bar = "#" * $barLen
        $line = "  {0,-25} {1,4} ({2,6:N2}%) {3}" -f $container, $count, $percentage, $bar
        Write-Host $line
    }

    # Metricas estadisticas
    $avg = 100 / $containers.Count
    $sumSq = 0
    foreach ($p in $percentages) {
        $sumSq += [math]::Pow($p - $avg, 2)
    }
    $stddev = [math]::Sqrt($sumSq / $percentages.Count)
    $max = ($percentages | Measure-Object -Maximum).Maximum

    Write-Host ""
    Write-Host "Metricas:" -ForegroundColor Yellow
    Write-Host "---------------------------------"
    Write-Host ("  Promedio esperado: {0:N2}%" -f $avg)
    Write-Host ("  Desviacion estandar: {0:N2}" -f $stddev)
    Write-Host ("  Maximo observado: {0:N2}%" -f $max)

    Write-Host ""

    # Evaluacion
    if ($containers.Count -le 1) {
        Write-Host "  [X] No hay balanceo (solo 1 contenedor)" -ForegroundColor Red
    }
    elseif ($max -gt 70) {
        Write-Host "  [!] Balanceo muy sesgado (un nodo domina)" -ForegroundColor DarkYellow
    }
    elseif ($stddev -lt 5) {
        Write-Host "  [OK] Balanceo uniforme" -ForegroundColor Green
    }
    else {
        Write-Host "  [!] Balanceo presente pero no uniforme" -ForegroundColor Yellow
    }

    Write-Host ""
}

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host " VALIDACION AVANZADA DE BALANCEADOR" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

Test-Balancing -Url $API_URL -ServiceName "API"
Test-Balancing -Url $SEARCH_URL -ServiceName "Search"

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host " Validacion completada" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta