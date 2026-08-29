<# verificar-requisitos.ps1
   Comprueba la presencia de herramientas y versiones necesarias.
   NO instala programas externos. Muestra instrucciones claras si falta algo.
#>

$logFile = Join-Path -Path $PSScriptRoot -ChildPath "..\logs\installer_install.log" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $logFile) { $logFile = Join-Path -Path $PSScriptRoot -ChildPath "..\logs\installer_install.log" }

function Log {
    param([string]$msg)
    $ts = (Get-Date).ToString('s')
    "$ts`t$msg" | Out-File -FilePath $logFile -Append -Encoding utf8
}

Write-Host "Verificando requisitos..." -ForegroundColor Cyan
Log "Iniciando verificación de requisitos."

# Helper
function Check-Cmd {
    param([string]$cmd, [string]$arg = "--version")
    try {
        $proc = & $cmd $arg 2>&1
        return $proc -join " `n"
    } catch {
        return $null
    }
}

# 1. OS
$os = Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version
if ($os) { Write-Host "Windows: $($os.Caption) ($($os.Version)) [OK]"; Log "Windows detected: $($os.Caption) $($os.Version)" } else { Write-Host "Windows no detectado [ERROR]" -ForegroundColor Red; Log "ERROR: Windows no detectado" }

# 2. Git
$git = Check-Cmd git --version
if ($git) { Write-Host "Git: $git [OK]"; Log "Git: $git" } else { Write-Host "Git no encontrado [WARN]" -ForegroundColor Yellow; Write-Host "Instalar desde https://git-scm.com/"; Log "WARNING: Git no encontrado" }

$fatal = $false

# 3. PHP
$php = Check-Cmd php -v
if ($php) {
    Write-Host "PHP: $($php -split "`n" | Select-Object -First 1) [OK]"
    Log "PHP: $($php -split "`n" | Select-Object -First 1)"
    # versión mínima
    $versionLine = ($php -split "`n")[0]
    if ($versionLine -match "PHP ([0-9]+)\.([0-9]+)\.([0-9]+)") {
        $major = [int]$Matches[1]; $minor = [int]$Matches[2]
        if ($major -lt 8 -or ($major -eq 8 -and $minor -lt 3)) {
            Write-Host "PHP >= 8.3 es requerido. Versión detectada: $major.$minor [ERROR]" -ForegroundColor Red
            Log "ERROR: PHP < 8.3 detectado: $major.$minor"
            $fatal = $true
        }
    } else {
        Write-Host "No se pudo parsear versión de PHP. Verifique que php -v funcione." -ForegroundColor Yellow; Log "WARNING: php version parse failed"
    }
    # comprobar pdo_mysql
    $phpModules = Check-Cmd php -m
    if ($phpModules -and $phpModules -match "pdo_mysql") {
        Write-Host "Extensión pdo_mysql encontrada [OK]"; Log "pdo_mysql enabled"
    } else {
        Write-Host "Extensión pdo_mysql NO encontrada [ERROR]" -ForegroundColor Red; Log "ERROR: pdo_mysql missing"; Write-Host "Habilite pdo_mysql (php.ini) o use distribución con pdo_mysql." -ForegroundColor Yellow
        $fatal = $true
    }
} else {
    Write-Host "PHP no encontrado [ERROR]" -ForegroundColor Red; Log "ERROR: PHP no encontrado"; $fatal = $true
}

# 4. Composer
$composer = Check-Cmd composer --version
if ($composer) { Write-Host "Composer: $composer [OK]"; Log "Composer: $composer" } else { Write-Host "Composer no encontrado [ERROR]" -ForegroundColor Red; Write-Host "Instalar desde https://getcomposer.org/"; Log "ERROR: Composer no encontrado"; $fatal = $true }

# 5. Node
$node = Check-Cmd node --version
if ($node) { Write-Host "Node: $node [OK]"; Log "Node: $node" } else { Write-Host "Node no encontrado [ERROR]" -ForegroundColor Red; Write-Host "Instalar desde https://nodejs.org/"; Log "ERROR: Node no encontrado"; $fatal = $true }

# 6. npm
$npm = Check-Cmd npm --version
if ($npm) { Write-Host "npm: $npm [OK]"; Log "npm: $npm" } else { Write-Host "npm no encontrado [ERROR]" -ForegroundColor Red; Log "ERROR: npm no encontrado"; $fatal = $true }

# 7. MySQL - comprobar servicio y cliente
$mysqlClient = Check-Cmd mysql --version
if ($mysqlClient) { Write-Host "MySQL client: $mysqlClient [OK]"; Log "MySQL client: $mysqlClient" } else { Write-Host "MySQL client no encontrado (mysql) [WARN]" -ForegroundColor Yellow; Log "WARNING: mysql client not found" }

# Intentar detectar servicio MySQL
try {
    $service = Get-Service -Name MySQL* -ErrorAction SilentlyContinue
    if ($service) { Write-Host "Servicio MySQL detectado: $($service.Name) ($($service.Status)) [OK]"; Log "MySQL service: $($service.Name) $($service.Status)" } else { Write-Host "Servicio MySQL no detectado por nombre (intentar conectar manualmente) [WARN]" -ForegroundColor Yellow; Log "WARNING: MySQL service not detected by name" }
} catch {
    Write-Host "No se pudo comprobar servicio MySQL [WARN]" -ForegroundColor Yellow; Log "WARNING: error al comprobar servicio MySQL: $_"
}

# 8. Espacio en disco: comprobar C:\ (>= 5GB recomendado)
$free = (Get-PSDrive -Name C).Free
$freeGB = [Math]::Round($free/1GB,2)
Write-Host "Espacio libre en C:\ : $freeGB GB"; Log "Disk free C:\ : $freeGB GB"

if ($fatal) {
    Write-Host "Se han detectado errores críticos. Corrija los elementos marcados antes de continuar." -ForegroundColor Red
    Log "Verification failed: fatal issues detected"
    exit 1
}

Write-Host "Verificación completada. Revisar $logFile para detalles." -ForegroundColor Green
Log "Verificación completada."

# Salida final: establecer código de salida 0
exit 0
