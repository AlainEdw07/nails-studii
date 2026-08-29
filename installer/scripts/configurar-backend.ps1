<# configurar-backend.ps1
   Realiza los pasos necesarios para preparar el backend Laravel.
   - copia .env.example a .env
   - configura DB con lo guardado por configurar-base-datos.ps1
   - composer install
   - php artisan key:generate
   - php artisan jwt:secret
   - php artisan migrate
   - php artisan db:seed
   - limpiar cachés
#>

$logFile = Join-Path -Path $PSScriptRoot -ChildPath "..\logs\installer_install.log"
function Log { param([string]$m) "$((Get-Date).ToString('s'))`t$m" | Out-File -FilePath $logFile -Append -Encoding utf8 }
Write-Host "Configurando backend..." -ForegroundColor Cyan
Log "Iniciando configurar-backend.ps1"

$repoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$backendPath = Join-Path $repoRoot 'back-end'
if (-not (Test-Path $backendPath)) { Write-Host "No se encuentra la carpeta back-end en: $backendPath" -ForegroundColor Red; Log "ERROR: back-end folder missing: $backendPath"; exit 1 }

# 1. Copiar .env
$envExample = Join-Path $backendPath '.env.example'
$envFile = Join-Path $backendPath '.env'
if (-not (Test-Path $envFile)) {
    Copy-Item -Path $envExample -Destination $envFile -ErrorAction Stop
    Write-Host "Se copió .env desde .env.example" -ForegroundColor Green
    Log ".env created from .env.example"
} else {
    Write-Host ".env ya existe, no lo sobrescribo." -ForegroundColor Yellow
    Log ".env already exists; skipped copy"
}

# 2. Leer configuración de DB si existe
$configFile = Join-Path -Path $PSScriptRoot -ChildPath "..\install_db_config.json"
if (Test-Path $configFile) {
    $cfg = Get-Content $configFile | ConvertFrom-Json
    $dbName = $cfg.database; $dbHost = $cfg.host; $dbPort = $cfg.port; $dbUser = $cfg.user
    Write-Host "Aplicando configuración DB en .env: $dbUser@$dbHost:$dbPort/$dbName" -ForegroundColor Green
    (Get-Content $envFile) -replace 'DB_CONNECTION=.*', 'DB_CONNECTION=mysql' | Set-Content $envFile
    (Get-Content $envFile) -replace 'DB_HOST=.*', "DB_HOST=$dbHost" | Set-Content $envFile
    (Get-Content $envFile) -replace 'DB_PORT=.*', "DB_PORT=$dbPort" | Set-Content $envFile
    (Get-Content $envFile) -replace 'DB_DATABASE=.*', "DB_DATABASE=$dbName" | Set-Content $envFile
    (Get-Content $envFile) -replace 'DB_USERNAME=.*', "DB_USERNAME=$dbUser" | Set-Content $envFile
    # DB_PASSWORD remains to be filled by user to avoid storing it in logs; ask interactively
    $dbPass = Read-Host -AsSecureString "Ingrese contraseña DB para escribir en .env (dejar vacía si no tiene)"
    $dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))
    if (-not [string]::IsNullOrWhiteSpace($dbPassPlain)) {
        (Get-Content $envFile) -replace 'DB_PASSWORD=.*', "DB_PASSWORD=$dbPassPlain" | Set-Content $envFile
    } else {
        Write-Host "DB_PASSWORD no fue modificada en .env (debe editar manualmente si aplica)." -ForegroundColor Yellow
    }
    Log "Applied DB config to .env"
} else {
    Write-Host "No existe install_db_config.json. Asegúrese de ejecutar configurar-base-datos.ps1 primero." -ForegroundColor Yellow
    Log "WARNING: install_db_config.json not found"
}

# 3. composer install
Write-Host "Ejecutando composer install en back-end..." -ForegroundColor Cyan
Push-Location $backendPath
try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "composer"
    $psi.Arguments = "install --no-interaction --prefer-dist"
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $p = [System.Diagnostics.Process]::Start($psi)
    $out = $p.StandardOutput.ReadToEnd(); $err = $p.StandardError.ReadToEnd(); $p.WaitForExit()
    Write-Host $out
    if ($p.ExitCode -ne 0) { Write-Host "composer install falló: $err" -ForegroundColor Red; Log "ERROR: composer install failed: $err"; Pop-Location; exit 1 }
    Log "composer install completed"
} catch {
    Write-Host "Error ejecutando composer: $_" -ForegroundColor Red; Log "ERROR composer: $_"; Pop-Location; exit 1
}

# 4. php artisan key:generate
try {
    & php artisan key:generate --ansi
    Log "artisan key:generate OK"
} catch {
    Write-Host "Error al generar APP_KEY: $_" -ForegroundColor Red; Log "ERROR artisan key:generate: $_"; Pop-Location; exit 1
}

# 5. php artisan jwt:secret
try {
    & php artisan jwt:secret --ansi
    Log "artisan jwt:secret OK"
} catch {
    Write-Host "Error al generar JWT_SECRET: $_" -ForegroundColor Yellow; Log "WARNING artisan jwt:secret: $_"
}

# 6. Migraciones
try {
    & php artisan migrate --force
    Log "artisan migrate OK"
} catch {
    Write-Host "Error en migrate: $_" -ForegroundColor Red; Log "ERROR migrate: $_"; Pop-Location; exit 1
}

# 7. Seeders
try {
    & php artisan db:seed --force
    Log "artisan db:seed OK"
} catch {
    Write-Host "Error en db:seed: $_" -ForegroundColor Yellow; Log "WARNING db:seed: $_"
}

# 8. Cache clear
& php artisan config:clear
& php artisan cache:clear
& php artisan route:clear
& php artisan view:clear
Log "Cleared caches"

Pop-Location
Write-Host "Backend configurado." -ForegroundColor Green
Log "configure-backend completed"
exit 0
