<# validar_instalacion.ps1
   Comprueba servicios básicos tras la instalación:
   - Conexión MySQL (opcional si cliente mysql está disponible)
   - Endpoint API /api/v1/servicios
   - Presencia de build front-end (www folder)

   Ejecutar desde la carpeta de instalación (por ejemplo C:\NailsStudio) o ajustar -InstallDir.
#>
param(
    [string]$InstallDir = "C:\\NailsStudio",
    [string]$ApiUrl = "http://localhost:8000/api/v1",
    [string]$MySqlUser = "",
    [string]$MySqlPass = "",
    [string]$MySqlHost = "localhost",
    [int]$MySqlPort = 3306
)

Write-Host "Validación de instalación: InstallDir=$InstallDir, ApiUrl=$ApiUrl"

$ok = $true

# 1) Verificar API
try {
    $uri = "$ApiUrl/servicios"
    Write-Host "Comprobando API: $uri"
    $resp = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($resp.StatusCode -eq 200) { Write-Host "API OK (200)" } else { Write-Host "API respondió código $($resp.StatusCode)"; $ok = $false }
} catch {
    Write-Host "Error al conectar con API: $_"; $ok = $false
}

# 2) Verificar carpeta front-end/www
$frontendBuild = Join-Path $InstallDir "front-end\www"
if (Test-Path $frontendBuild) { Write-Host "Frontend build encontrado: $frontendBuild" } else { Write-Host "Frontend build NO encontrado en: $frontendBuild"; $ok = $false }

# 3) Verificar MySQL (si mysql.exe disponible)
$mysqlExe = (Get-Command mysql -ErrorAction SilentlyContinue).Path
if ($mysqlExe) {
    Write-Host "Cliente mysql encontrado: $mysqlExe. Probando conexión..."
    try {
        $args = "-h $MySqlHost -P $MySqlPort -u $MySqlUser"
        if ($MySqlPass -ne "") { $args += " -p$MySqlPass" }
        # Ejecutar comando simple: SELECT 1
        $proc = Start-Process -FilePath $mysqlExe -ArgumentList "$args -e \"SELECT 1;\"" -NoNewWindow -Wait -PassThru
        if ($proc.ExitCode -eq 0) { Write-Host "MySQL: conexión OK" } else { Write-Host "MySQL: exitcode $($proc.ExitCode)"; $ok = $false }
    } catch {
        Write-Host "Error al ejecutar cliente mysql: $_"; $ok = $false
    }
} else {
    Write-Host "Cliente mysql no encontrado en PATH. Omitiendo prueba directa de MySQL. (Instalador puede aún configurar la BD)."
}

if ($ok) { Write-Host "VALIDACIÓN: OK"; exit 0 } else { Write-Host "VALIDACIÓN: FALLÓ"; exit 2 }
