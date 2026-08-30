<# build_staging.ps1
   Crea una carpeta de staging para el instalador en installer\setup\staging
   Estrategia: usar robocopy cuando esté disponible y excluir explícitamente carpetas/archivos
   Evitar copiar recursivamente el propio staging (installer\setup\staging).
   Ejecutar desde la raíz del repo: powershell -ExecutionPolicy Bypass -File installer\scripts\build_staging.ps1
#>

Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path ".").Path
$stagingRoot = Join-Path $repoRoot "installer\setup\staging"

Write-Host "Repository root: $repoRoot"
Write-Host "Staging target: $stagingRoot"

# 1) Eliminar staging anterior de forma segura
if (Test-Path $stagingRoot) {
    Write-Host "Staging existente encontrado. Eliminando: $stagingRoot"
    try {
        Remove-Item -LiteralPath $stagingRoot -Recurse -Force -ErrorAction Stop
        Write-Host "Staging anterior eliminado." -ForegroundColor Green
    } catch {
        Write-Host "Error eliminando staging anterior: $_" -ForegroundColor Yellow
        Write-Host "Intentando eliminar archivos individuales..."
        Get-ChildItem -Path $stagingRoot -Force -Recurse | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 1
        if (Test-Path $stagingRoot) { Remove-Item -LiteralPath $stagingRoot -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

# Crear carpeta staging
New-Item -ItemType Directory -Force -Path $stagingRoot | Out-Null

# Exclusiones globales
$excludeDirs = @('node_modules','vendor','.git','logs','storage','tmp','temp','.vs','.idea','build','.gradle','.cxx','captures')
$excludeFiles = @('.env','.env.local')

# Folders to include
$folders = @('back-end','front-end','base-ts-baileys-memory','wearable')

# Helper: use robocopy if available
function Copy-With-Robocopy {
    param(
        [string]$Source,
        [string]$Destination,
        [string[]]$ExcludeDirs,
        [string[]]$ExcludeFiles
    )
    if (-not (Test-Path $Source)) { Write-Host "Source not found: $Source" -ForegroundColor Yellow; return 1 }
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null

    $robocopy = (Get-Command robocopy -ErrorAction SilentlyContinue).Path
    if ($robocopy) {
        Write-Host "Using robocopy for $Source -> $Destination"

        # Build ArgumentList array and include /XD and /XF entries so robocopy actually receives them
        $argList = @($Source, $Destination, '/E', '/COPY:DAT', '/R:2', '/W:1')
        if ($ExcludeDirs -and $ExcludeDirs.Count -gt 0) {
            foreach ($d in $ExcludeDirs) { $argList += '/XD'; $argList += $d }
        }
        if ($ExcludeFiles -and $ExcludeFiles.Count -gt 0) {
            foreach ($f in $ExcludeFiles) { $argList += '/XF'; $argList += $f }
        }
        $argList += '/MT:8'

        Write-Host "Running: robocopy $($argList -join ' ')"
        $start = Get-Date
        $proc = Start-Process -FilePath $robocopy -ArgumentList $argList -NoNewWindow -Wait -PassThru
        $end = Get-Date
        $elapsed = $end - $start
        Write-Host "Robocopy finished for $Source in $($elapsed.ToString()) with exit code $($proc.ExitCode)"
        return $proc.ExitCode
    } else {
        Write-Host "robocopy not found. Falling back to filtered Copy-Item for $Source -> $Destination"
        # fallback: copy hierarchically but skip excludes using a foreach loop (avoid ForEach-Object+return)
        foreach ($item in Get-ChildItem -Path $Source -Force -ErrorAction SilentlyContinue) {
            $name = $item.Name
            if ($item.PSIsContainer) {
                if ($ExcludeDirs -and ($ExcludeDirs -contains $name)) { Write-Host "Skipping dir: $name"; continue }
                $destSub = Join-Path $Destination $name
                Copy-With-Robocopy -Source $item.FullName -Destination $destSub -ExcludeDirs $ExcludeDirs -ExcludeFiles $ExcludeFiles | Out-Null
            } else {
                if ($ExcludeFiles -and ($ExcludeFiles -contains $name)) { Write-Host "Skipping file: $name"; continue }
                Copy-Item -Path $item.FullName -Destination (Join-Path $Destination $name) -Force
            }
        }
        return 0
    }
}

# Start time
$globalStart = Get-Date

# Copy each main folder
foreach ($f in $folders) {
    $src = Join-Path $repoRoot $f
    if (-not (Test-Path $src)) { Write-Host "Folder not found (skipped): $f"; continue }
    $dest = Join-Path $stagingRoot $f
    Write-Host "Starting copy of $f..." -ForegroundColor Cyan
    $start = Get-Date
    $code = Copy-With-Robocopy -Source $src -Destination $dest -ExcludeDirs $excludeDirs -ExcludeFiles $excludeFiles
    $end = Get-Date
    $elapsed = $end - $start
    if ($code -ge 8) { Write-Host "Robocopy failed with code $code for $f" -ForegroundColor Red; exit $code }
    $count = (Get-ChildItem -Path $dest -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count
    $size = (Get-ChildItem -Path $dest -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [Math]::Round(($size/1MB),2)
    Write-Host "Finished copy of ${f}: files=$count size=${sizeMB}MB time=$($elapsed.ToString())" -ForegroundColor Green
}

# Copy installer folder but exclude the setup folder to avoid recursion
$installerSrc = Join-Path $repoRoot 'installer'
$installerDest = Join-Path $stagingRoot 'installer'
if (Test-Path $installerSrc) {
    Write-Host "Copying installer folder (excluding setup)..." -ForegroundColor Cyan
    # Use robocopy excluding 'setup' and other excludeDirs
    $excludeDirsInstaller = $excludeDirs + @('setup')
    $code = Copy-With-Robocopy -Source $installerSrc -Destination $installerDest -ExcludeDirs $excludeDirsInstaller -ExcludeFiles $excludeFiles
    if ($code -ge 8) { Write-Host "Robocopy failed copying installer with code $code" -ForegroundColor Red; exit $code }
    $count = (Get-ChildItem -Path $installerDest -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "Installer folder copied: files=$count" -ForegroundColor Green
}

# Final report
$globalEnd = Get-Date
$globalElapsed = $globalEnd - $globalStart
$totalCount = (Get-ChildItem -Path $stagingRoot -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count
$totalSize = (Get-ChildItem -Path $stagingRoot -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [Math]::Round(($totalSize/1MB),2)

Write-Host "\nStaging summary:"
Write-Host "  Path: $stagingRoot"
Write-Host "  Files: $totalCount"
Write-Host "  Size: ${totalSizeMB} MB"
Write-Host "  Time elapsed: $($globalElapsed.ToString())"

# Validations: ensure excludes are not present
$foundProblems = $false
$badPaths = @('node_modules','vendor','.git','logs','storage','.env','installer\setup\staging')
foreach ($p in $badPaths) {
    $found = Get-ChildItem -Path $stagingRoot -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match [regex]::Escape("\\$p") }
    if ($found) {
        Write-Host "[ERROR] Excluded pattern found in staging: $p" -ForegroundColor Red
        $foundProblems = $true
    }
}

if ($foundProblems) {
    Write-Host "One or more excluded items were copied into staging. Please review." -ForegroundColor Red
    exit 2
}

Write-Host "Staging created successfully." -ForegroundColor Green
exit 0
