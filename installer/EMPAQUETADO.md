EMPAQUETADO: Cómo generar MC_NAILS_STUDIO_Setup.exe

Requisitos en la máquina de empaquetado (Windows):
- PowerShell (incluido en Windows 10/11)
- Inno Setup 6 (para compilar .iss)
- Acceso a Internet (para comprobar dependencias si se desea)

1) Generar carpeta de staging
Desde la raíz del repositorio ejecutar (PowerShell):

    powershell -ExecutionPolicy Bypass -File .\installer\scripts\build_staging.ps1

Esto creará: .\installer\setup\staging\ con el contenido del proyecto necesario para el instalador. Excluye node_modules, vendor, .git, .env y logs. Verifique que el staging contiene las carpetas:
- back-end
- front-end
- base-ts-baileys-memory
- installer

2) Preparar .iss (ya incluido en installer\MC_NAILS_STUDIO.iss)
El archivo .iss está preparado para usar la carpeta setup\staging en relación con la ubicación del .iss. No utilice rutas absolutas.

3) Compilar con Inno Setup (línea de comandos)
Abrir "Inno Setup Compiler" o usar ISCC.exe por línea de comandos. Ejemplo con ruta por defecto a ISCC.exe:

    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "C:\ruta\al\repo\installer\MC_NAILS_STUDIO.iss"

Salida esperada:
- Archivo: MC_NAILS_STUDIO_Setup.exe (generado en la carpeta de salida indicada por Inno Setup, normalmente el subdirectorio Output del compilador o junto al .iss)

4) Probar el instalador en VM limpia
- Copie MC_NAILS_STUDIO_Setup.exe a una máquina Windows de prueba (sin herramientas de desarrollo instaladas).
- Antes de ejecutar, instale PHP >=8.3, Composer, MySQL y Node/npm si no desea que el instalador solicite al usuario que los instale.
- Ejecutar el .exe y seguir pasos. Al final, el instalador ejecutará installer\scripts\instalar.ps1 para configurar componentes.

Notas:
- El instalador NO incluye node_modules ni vendor. Durante la instalación, se ejecutarán composer install y npm install en la máquina destino, por eso se requiere conexión a Internet.
- Si desea empacar vendor/node_modules dentro del instalador (no recomendado), ejecute build_staging.ps1, genere node_modules/vendor en el staging y luego compile; tenga en cuenta el tamaño resultante y posibles incompatibilidades binarios.

5) Ubicación del .exe generado
- Por defecto Inno Setup coloca el ejecutable en la carpeta de salida configurada (Output) o en la misma carpeta del .iss. Compruebe el mensaje del compilador para la ruta exacta.

6) Recomendaciones de prueba
- Use una VM limpia con snapshot antes de ejecutar el instalador para poder revertir en caso de error.
- Asegúrese de que el puerto 3306 (MySQL) y 8000 (Laravel php artisan serve) no estén ocupados por otras aplicaciones durante pruebas.

Si surge un error en la compilación de Inno Setup, copie el mensaje y revíselo; normalmente indica archivos faltantes en setup\staging o rutas erróneas en el .iss.