; Inno Setup script for Nails Studio - uses staging folder created by installer\scripts\build_staging.ps1
[Setup]
AppName=MC_NAILS_STUDIO
AppVersion=1.0.0
AppPublisher=MC_NAILS_STUDIO Project
AppPublisherURL=https://github.com/AlainEdw07/nails-studii
DefaultDirName={pf}\MC_NAILS_STUDIO
DisableProgramGroupPage=no
Compression=lzma
SolidCompression=yes
OutputBaseFilename=MC_NAILS_STUDIO_Setup

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Copiar desde la carpeta de staging creada por installer\scripts\build_staging.ps1
; Antes de compilar, ejecutar build_staging.ps1 para generar installer\setup\staging
Source: "setup\\staging\\back-end\\*"; DestDir: "{app}\\back-end"; Flags: recursesubdirs createallsubdirs; Check: FileExists("setup\\staging\\back-end")
Source: "setup\\staging\\front-end\\*"; DestDir: "{app}\\front-end"; Flags: recursesubdirs createallsubdirs; Check: FileExists("setup\\staging\\front-end")
Source: "setup\\staging\\base-ts-baileys-memory\\*"; DestDir: "{app}\\base-ts-baileys-memory"; Flags: recursesubdirs createallsubdirs; Check: FileExists("setup\\staging\\base-ts-baileys-memory")
Source: "setup\\staging\\wearable\\*"; DestDir: "{app}\\wearable"; Flags: recursesubdirs createallsubdirs; Check: FileExists("setup\\staging\\wearable")
Source: "setup\\staging\\installer\\*"; DestDir: "{app}\\installer"; Flags: recursesubdirs createallsubdirs; Check: FileExists("setup\\staging\\installer")

[Dirs]
Name: "{app}\logs"; Flags: uninsalwaysuninstall
Name: "{app}\installer"; Flags: uninsalwaysuninstall

[Icons]
; Primary icon: open SPA index.html (if present)
Name: "{group}\MC_NAILS_STUDIO"; Filename: "{app}\back-end\public\spa\index.html"; Tasks: desktopicon; Flags: shellexec
; Shortcut to start/stop scripts
Name: "{group}\Iniciar MC_NAILS_STUDIO"; Filename: "{app}\installer\launcher\iniciar_nails_studio.bat"
Name: "{group}\Detener MC_NAILS_STUDIO"; Filename: "{app}\installer\launcher\detener_nails_studio.bat"
Name: "{group}\Desinstalar MC_NAILS_STUDIO"; Filename: "{uninstallexe}"

[Run]
; Ejecutar el orquestador de instalación (PowerShell). Requiere privilegios y conexión a Internet.
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -NoProfile -File \"{app}\\installer\\scripts\\instalar.ps1\""; Flags: shellexec runasoriginal postinstall

; Mostrar README al finalizar
Filename: "{app}\installer\README.md"; Description: "Ver README"; Flags: shellexec postinstall

; NOTA: ajustar {#SourcePath} en tiempo de compilación si es necesario. Para compilar:
; 1. Abrir Inno Setup. 2. Reemplazar {#SourcePath} por la ruta de la raíz del repo o usar el comando de compilación con -DSourcePath="C:\ruta\al\repo"
; Ejemplo de compilación por línea de comandos:
; ISCC.exe /DSourcePath="C:\path\to\repo" MC_NAILS_STUDIO.iss

[Code]
// Placeholder para scripts adicionales si se quiere ejecutar comandos postinstall via Inno Setup.

; Importante: este .iss es una plantilla. Antes de compilar asegúrese de excluir node_modules y vendor para reducir tamaño.
