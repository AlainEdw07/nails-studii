@echo off
REM iniciar_nails_studio.bat
REM Este lanzador inicia backend (php artisan serve), frontend (ng serve) y chatbot (node) y guarda PIDs.

SET ROOT=%~dp0\..\..
SET ROOT=%ROOT:~0,-1%

echo ROOT set to %ROOT%

REM Llamar a PowerShell para iniciar procesos y guardar PIDs
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { 
    $pidsDir = Join-Path -Path '%~dp0' -ChildPath 'pids'; if (-not (Test-Path $pidsDir)) { New-Item -ItemType Directory -Path $pidsDir | Out-Null }

    # Backend
    $backendPath = Join-Path '%ROOT%' 'back-end'
    Write-Host 'Iniciando backend (php artisan serve)...'
    $phpProc = Start-Process -FilePath 'php' -ArgumentList 'artisan','serve','--host','0.0.0.0','--port','8000' -WorkingDirectory $backendPath -PassThru
    $phpProc.Id | Out-File -FilePath (Join-Path $pidsDir 'backend.pid') -Encoding ascii

    # Frontend
    Write-Host 'Frontend en producción: los archivos estáticos se han copiado a back-end/public/spa y deben servir por Apache/AMMPS. No se inicia servidor de desarrollo.'
    Out-File -FilePath (Join-Path $pidsDir 'frontend.pid') -InputObject 'STATIC_SERVED_BY_APACHE' -Encoding ascii

    # Chatbot
    $botPath = Join-Path '%ROOT%' 'base-ts-baileys-memory'
    Write-Host 'Iniciando chatbot (npm run dev)...'
    $botProc = Start-Process -FilePath 'npm' -ArgumentList 'run','dev' -WorkingDirectory $botPath -PassThru
    $botProc.Id | Out-File -FilePath (Join-Path $pidsDir 'chatbot.pid') -Encoding ascii

    Write-Host 'Procesos iniciados. PIDs guardados en installer\\launcher\\pids'
 }
"

pause
