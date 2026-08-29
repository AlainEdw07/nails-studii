<# configurar-chatbot.ps1
   Prepara el bot BuilderBot/Baileys:
   - copia .env.example a .env si no existe
   - permite configurar LARAVEL_API_URL y PORT
   - npm install
#>

$logFile = Join-Path -Path $PSScriptRoot -ChildPath "..\logs\installer_install.log"
function Log { param([string]$m) "$((Get-Date).ToString('s'))`t$m" | Out-File -FilePath $logFile -Append -Encoding utf8 }

Write-Host "Configurando chatbot..." -ForegroundColor Cyan
$repoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$botPath = Join-Path $repoRoot 'base-ts-baileys-memory'
if (-not (Test-Path $botPath)) { Write-Host "No se encuentra la carpeta base-ts-baileys-memory: $botPath" -ForegroundColor Red; Log "ERROR: chatbot folder missing"; exit 1 }

Push-Location $botPath
$envExample = Join-Path $botPath '.env.example'
$envFile = Join-Path $botPath '.env'
if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "Se copió .env desde .env.example" -ForegroundColor Green; Log ".env created for chatbot"
    }
}

# Pedir LARAVEL_API_URL y PORT
$laravelUrl = Read-Host "URL del backend Laravel para el chatbot (por defecto: http://localhost:8000/api/v1)"
if ([string]::IsNullOrWhiteSpace($laravelUrl)) { $laravelUrl = 'http://localhost:8000/api/v1' }
$port = Read-Host "Puerto para el chatbot (por defecto: 3008)"; if ([string]::IsNullOrWhiteSpace($port)) { $port = '3008' }

# Reemplazar o agregar valores en .env
$content = Get-Content $envFile -Raw
if ($content -match 'LARAVEL_API_URL=') { $content = $content -replace 'LARAVEL_API_URL=.*', "LARAVEL_API_URL=$laravelUrl" } else { $content += "`nLARAVEL_API_URL=$laravelUrl" }
if ($content -match 'PORT=') { $content = $content -replace 'PORT=.*', "PORT=$port" } else { $content += "`nPORT=$port" }
Set-Content -Path $envFile -Value $content -Encoding utf8
Write-Host "Chatbot .env actualizado: LARAVEL_API_URL=$laravelUrl PORT=$port" -ForegroundColor Green; Log "Chatbot env set"

# npm install
Write-Host "Ejecutando npm install en base-ts-baileys-memory..." -ForegroundColor Cyan
try { npm install; Log "chatbot npm install completed" } catch { Write-Host "npm install falló: $_" -ForegroundColor Red; Log "ERROR chatbot npm install: $_"; Pop-Location; exit 1 }

Pop-Location
Write-Host "Chatbot configurado. La vinculación de WhatsApp (QR) se realiza manualmente cuando se inicia el bot." -ForegroundColor Green
Log "configure-chatbot completed"
exit 0
