<# build_staging.ps1
   Crea una carpeta de staging para el instalador en installer\setup\staging
   Copia el contenido del repo necesario, excluyendo node_modules, vendor, .git, .env, logs y archivos temporales.
   Ejecutar desde la raíz del repo: powershell -ExecutionPolicy Bypass -File installer\scripts\build_staging.ps1
#>

$repoRoot = (Resolve-Path ".").Path
$stagingRoot = Join-Path $repoRoot "installer\setup\staging"
if (Test-Path $stagingRoot) { Remove-Item -Recurse -Force $stagingRoot }
New-Item -ItemType Directory -Path $stagingRoot | Out-Null

function Copy-Tree-Filtered {
    param(
        [string]$Source,
        [string]$Destination,
        [string[]]$ExcludeDirs = @('node_modules','vendor','.git','logs','storage','node_modules'),
        [string[]]$ExcludeFiles = @('.env','.env.local')
    )

    Write-Host "Copying $Source -> $Destination"
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null

    Get-ChildItem -Path $Source -Force | ForEach-Object {
        $item = $_
        $name = $item.Name
        if ($item.PSIsContainer) {
            if ($ExcludeDirs -contains $name) { Write-Host "Skipping dir: $name"; return }
            $destSub = Join-Path $Destination $name
            Copy-Tree-Filtered -Source $item.FullName -Destination $destSub -ExcludeDirs $ExcludeDirs -ExcludeFiles $ExcludeFiles
        } else {
            # Skip excluded files
            foreach ($pat in $ExcludeFiles) {
                if ($name -like $pat) { Write-Host "Skipping file: $name"; return }
            }
            Copy-Item -Path $item.FullName -Destination (Join-Path $Destination $name) -Force
        }
    }
}

# List of project folders to include (do NOT include wearable)
$folders = @('back-end','front-end','base-ts-baileys-memory')
foreach ($f in $folders) {
    $src = Join-Path $repoRoot $f
    if (Test-Path $src) {
        $dest = Join-Path $stagingRoot $f
        Copy-Tree-Filtered -Source $src -Destination $dest
    } else {
        Write-Host "Folder not found (skipped): $f"
    }
}

# Copy installer folder itself (scripts and launcher) into staging/installer so the installer can run them after install
$installerSrc = Join-Path $repoRoot 'installer'
$installerDest = Join-Path $stagingRoot 'installer'
Copy-Tree-Filtered -Source $installerSrc -Destination $installerDest

# Ensure staging excludes: .git, node_modules, vendor, .env, logs, storage
Write-Host "Staging folders copied. Verify staging excludes .git, node_modules, vendor, .env, logs, storage"

Write-Host "Staging created at: $stagingRoot"
Write-Host "Size:"; Get-ChildItem -Recurse $stagingRoot | Measure-Object -Property Length -Sum | Select-Object Sum

exit 0
