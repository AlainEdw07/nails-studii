<# configurar-base-datos.ps1
   Solicita credenciales MySQL y crea la base de datos si no existe.
   Intenta usar el cliente mysql si está disponible. No elimina bases existentes sin confirmación.
#>

$logFile = Join-Path -Path $PSScriptRoot -ChildPath "..\logs\installer_install.log"
function Log { param([string]$m) "$((Get-Date).ToString('s'))`t$m" | Out-File -FilePath $logFile -Append -Encoding utf8 }

Write-Host "Configuración de la base de datos" -ForegroundColor Cyan

$defaultDb = Read-Host "Nombre de la base de datos (por defecto: nails_studio)"; if ([string]::IsNullOrWhiteSpace($defaultDb)) { $defaultDb = 'nails_studio' }
$dbHost = Read-Host "Host MySQL (por defecto: 127.0.0.1)"; if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = '127.0.0.1' }
$dbPort = Read-Host "Puerto MySQL (por defecto: 3306)"; if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = '3306' }
$dbUser = Read-Host "Usuario MySQL (por defecto: root)"; if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = 'root' }
$dbPass = Read-Host -AsSecureString "Contraseña MySQL (dejar vacía si no aplica)"
$dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))

Log "Database params: $defaultDb @ $dbHost:$dbPort user=$dbUser"

# Intentar crear la base usando mysql CLI
$mysqlCli = (Get-Command mysql -ErrorAction SilentlyContinue).Path
if ($mysqlCli) {
    Write-Host "mysql client encontrado en: $mysqlCli. Intentando crear base de datos si no existe..." -ForegroundColor Green
    $createSql = "CREATE DATABASE IF NOT EXISTS `$defaultDb` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    try {
        $env:MYSQL_PWD = $dbPassPlain
        $cmd = "`"$mysqlCli`" -h $dbHost -P $dbPort -u $dbUser -e `"$createSql`""
        Write-Host "Ejecutando: $cmd"
        Log "Run: $cmd"
        $out = Invoke-Expression $cmd 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Base de datos $defaultDb creada/confirmada [OK]" -ForegroundColor Green; Log "DB created or exists: $defaultDb"
        } else {
            Write-Host "No se pudo crear la base de datos con mysql client. Código: $LASTEXITCODE" -ForegroundColor Yellow; Log "mysql CLI create DB failed: $out"
            Write-Host "Puedes crear la base manualmente o revisar credenciales." -ForegroundColor Yellow
        }
        Remove-Variable MYSQL_PWD -ErrorAction SilentlyContinue
    } catch {
        Write-Host "Error al ejecutar mysql client: $_" -ForegroundColor Red; Log "ERROR mysql create: $_"
    }
} else {
    Write-Host "mysql CLI no disponible. Por favor crea la base de datos manualmente con tus herramientas (phpMyAdmin, MySQL Workbench, etc.)." -ForegroundColor Yellow
    Log "WARNING: mysql client not available; DB not created."
}

# Guardar configuración parcial en archivo temporal para el instalador
$configFile = Join-Path -Path $PSScriptRoot -ChildPath "..\install_db_config.json"
$cfg = @{ database = $defaultDb; host = $dbHost; port = $dbPort; user = $dbUser }
$cfg | ConvertTo-Json | Out-File -FilePath $configFile -Encoding utf8
Write-Host "Parámetros guardados en: $configFile" -ForegroundColor Green
Log "DB config saved to $configFile"

exit 0
