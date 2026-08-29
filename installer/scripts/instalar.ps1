<# instalar.ps1
   Script orquestador para ejecutar la instalación paso a paso.
   1) Ejecutar verificar-requisitos.ps1
   2) Ejecutar configurar-base-datos.ps1
   3) Ejecutar configurar-backend.ps1
   4) Ejecutar configurar-frontend.ps1
   5) Ejecutar configurar-chatbot.ps1
   6) Ejecutar validaciones post-instalación
#>

$root = (Resolve-Path "$PSScriptRoot\..\").Path
$log = Join-Path $root 'installer\logs\installer_install.log'
function Log { param([string]$m) "$((Get-Date).ToString('s'))`t$m" | Out-File -FilePath $log -Append -Encoding utf8 }

Write-Host "Iniciando instalación asistida de MC_NAILS_STUDIO" -ForegroundColor Cyan
Log "Installation started"

function Run-Step { param($scriptPath, $desc)
    Write-Host "---- $desc ----" -ForegroundColor Cyan
    Log "Starting step: $desc"
    try {
        & $scriptPath
        if ($LASTEXITCODE -ne 0) { Write-Host "Step failed: $desc (exit code $LASTEXITCODE)" -ForegroundColor Red; Log "ERROR step $desc exit $LASTEXITCODE"; exit $LASTEXITCODE }
        Write-Host "Step completed: $desc" -ForegroundColor Green; Log "Completed step: $desc"
    } catch {
        Write-Host "Exception running step $desc: $_" -ForegroundColor Red; Log "ERROR exception step $desc: $_"; exit 1
    }
}

Write-Host "1) Verificando requisitos..." -ForegroundColor Cyan
Run-Step "$root\installer\scripts\verificar-requisitos.ps1" "Verificar requisitos"

Write-Host "2) Configurar base de datos..." -ForegroundColor Cyan
Run-Step "$root\installer\scripts\configurar-base-datos.ps1" "Configurar base de datos"

Write-Host "3) Configurar backend (Laravel)..." -ForegroundColor Cyan
Run-Step "$root\installer\scripts\configurar-backend.ps1" "Configurar backend"

Write-Host "4) Configurar frontend (Ionic/Angular)..." -ForegroundColor Cyan
Run-Step "$root\installer\scripts\configurar-frontend.ps1" "Configurar frontend"

Write-Host "5) Configurar chatbot (BuilderBot/Baileys)..." -ForegroundColor Cyan
Run-Step "$root\installer\scripts\configurar-chatbot.ps1" "Configurar chatbot"

Write-Host "6) Validaciones post-instalación..." -ForegroundColor Cyan
# Validación simple: comprobar que backend responde
try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/api/v1 -TimeoutSec 10 -ErrorAction Stop
    Write-Host "Backend respondió: $($resp.StatusCode)" -ForegroundColor Green; Log "Backend OK"
} catch {
    Write-Host "No se pudo contactar al backend en http://localhost:8000/api/v1. Compruebe que php artisan serve esté activo." -ForegroundColor Yellow; Log "WARNING: backend not responding: $_"
}

Write-Host "Instalación finalizada. Revise installer\logs\installer_install.log para detalles." -ForegroundColor Green
Log "Installation finished"
exit 0
