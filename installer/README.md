MC_NAILS_STUDIO Installer - Instrucciones de compilación

1) Instalar Inno Setup (https://jrsoftware.org/isinfo.php)
2) Abrir PowerShell en la raíz del repositorio y generar la carpeta de staging (asegúrese de que staging no exista o está vacío):
   powershell -ExecutionPolicy Bypass -File .\installer\scripts\build_staging.ps1
   Esto creará: .\installer\setup\staging\
3) Abrir Inno Setup Compiler y cargar installer\MC_NAILS_STUDIO.iss (el .iss usa setup\staging relativo a su carpeta installer).
4) Compilar el script. El exe generado será MC_NAILS_STUDIO_Setup.exe
5) Si prefiere compilar desde línea de comandos con ISCC.exe (ruta por defecto):
   "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "C:\ruta\al\repo\installer\MC_NAILS_STUDIO.iss"

Pruebas en equipo limpio:
- Preparar máquina Windows con: Git, PHP 8.3, Composer, Node.js, npm, MySQL.
- Copiar el exe y ejecutarlo.
- Una vez instalado, ejecutar el lanzador desde el acceso directo.

Notas de seguridad:
- No incluir secretos ni archivos .env en el instalador.
- El instalador generará los .env de forma interactiva.
