<# configurar-frontend.ps1
   Prepara el frontend (npm install) y comprueba apiUrl en environment.ts
#>

$logFile = Join-Path -Path $PSScriptRoot -ChildPath "..\logs\installer_install.log"
function Log { param([string]$m) "$((Get-Date).ToString('s'))`t$m" | Out-File -FilePath $logFile -Append -Encoding utf8 }

Write-Host "Configurando frontend..." -ForegroundColor Cyan
$repoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$fePath = Join-Path $repoRoot 'front-end'
if (-not (Test-Path $fePath)) { Write-Host "No se encuentra la carpeta front-end: $fePath" -ForegroundColor Red; Log "ERROR: front-end missing"; exit 1 }

Push-Location $fePath
Write-Host "Ejecutando: npm install" -ForegroundColor Cyan
try {
    npm install
    Log "npm install completed"
} catch {
    Write-Host "npm install falló: $_" -ForegroundColor Red; Log "ERROR npm install: $_"; Pop-Location; exit 1
}

Write-Host "Ejecutando: npm run build (build de producción según angular.json - outputPath: www)" -ForegroundColor Cyan
try {
    npm run build
    Log "npm run build completed"
} catch {
    Write-Host "npm run build falló: $_" -ForegroundColor Red; Log "ERROR npm run build: $_"; Pop-Location; exit 1
}

# Verificar configuración del apiUrl en environment.ts
$envFile = Join-Path $fePath 'src\environments\environment.ts'
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match "apiUrl:\s*'([^']+)'") {
        $apiUrl = $Matches[1]
        Write-Host "Frontend apiUrl detectado: $apiUrl" -ForegroundColor Green; Log "Frontend apiUrl: $apiUrl"
    } else { Write-Host "No se detectó apiUrl en environment.ts" -ForegroundColor Yellow; Log "WARNING: environment.ts apiUrl not found" }
} else { Write-Host "environment.ts no existe" -ForegroundColor Yellow; Log "WARNING: environment.ts missing" }

# Copiar build al public del backend en carpeta 'spa'
$buildOut = Join-Path $fePath 'www'
$backendPublic = Join-Path $repoRoot 'back-end\public'
$destSpa = Join-Path $backendPublic 'spa'
if (-not (Test-Path $buildOut)) { Write-Host "Build no encontrado en: $buildOut" -ForegroundColor Red; Log "ERROR: frontend build missing"; Pop-Location; exit 1 }

Write-Host "Copiando build frontend a: $destSpa" -ForegroundColor Cyan
if (Test-Path $destSpa) { Remove-Item -Recurse -Force $destSpa }
New-Item -ItemType Directory -Path $destSpa | Out-Null
Copy-Item -Path (Join-Path $buildOut '*') -Destination $destSpa -Recurse -Force

# Crear .htaccess para fallback SPA (si el server lo respeta)
$htaccess = "<IfModule mod_rewrite.c>`n  RewriteEngine On`n  RewriteCond %{REQUEST_FILENAME} !-f`n  RewriteCond %{REQUEST_FILENAME} !-d`n  RewriteRule ^ index.html [L,QSA]`n</IfModule>"
$htPath = Join-Path $destSpa '.htaccess'
$htaccess | Out-File -FilePath $htPath -Encoding ascii

Pop-Location
Write-Host "Frontend configurado y copiado al backend/public/spa." -ForegroundColor Green
Log "configure-frontend completed; copied to $destSpa"
exit 0
