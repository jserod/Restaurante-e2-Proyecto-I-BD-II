$URL = "http://localhost/search/products?q=cafe"
$REQUESTS = 5

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA DE CACHE EN REDIS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: $URL" -ForegroundColor Yellow
Write-Host ""

$times = @()

for ($i = 1; $i -le $REQUESTS; $i++) {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        $response = Invoke-RestMethod -Uri $URL -Method GET -TimeoutSec 10
        $status = "OK"
    } catch {
        $status = "ERROR: $($_.Exception.Message)"
    }
    
    $stopwatch.Stop()
    $elapsed = $stopwatch.ElapsedMilliseconds
    
    $times += $elapsed
    
    $color = if ($i -eq 1) { "Gray" } elseif ($elapsed -lt 100) { "Green" } else { "White" }
    
    Write-Host ("Peticion {0}: {1,4} ms - {2}" -f $i, $elapsed, $status) -ForegroundColor $color
    
    # Pequeña pausa entre peticiones
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "Resultados:" -ForegroundColor Yellow
Write-Host "---------------------------------"
Write-Host ("Primera peticion (sin cache):  {0,4} ms" -f $times[0])
Write-Host ("Ultima peticion (con cache):   {0,4} ms" -f $times[-1])

if ($times[-1] -lt $times[0]) {
    $diff = $times[0] - $times[-1]
    Write-Host ""
    Write-Host "[OK] El cache funciona correctamente" -ForegroundColor Green
    Write-Host ("     Diferencia: {0} ms más rápido" -f $diff)
} else {
    Write-Host ""
    Write-Host "[!] No se detectó mejora con cache" -ForegroundColor Yellow
}