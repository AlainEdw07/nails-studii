INSTALACIÓN - MC_NAILS_STUDIO (resumen)

Resumen rápido
--------------
Este paquete contiene los scripts y archivos necesarios para preparar e instalar el sistema MC_NAILS_STUDIO en Windows.

Antes de ejecutar el instalador:
- Asegúrate de tener instalados: Git, PHP 8.3 (con pdo_mysql), Composer, Node.js, npm y MySQL.
- No se instalarán estos programas automáticamente: los scripts solo los detectan y guían.

Ejecución (modo manual / asistido):
1. Abrir PowerShell como Administrador.
2. Ejecutar: .\installer\scripts\verificar-requisitos.ps1
   - Este script verifica que PHP >= 8.3 (y pdo_mysql), Composer, Node y npm estén instalados. Si falta algún elemento crítico, el script finalizará con error y deberá instalar las herramientas indicadas.
3. Ejecutar: .\installer\scripts\instalar.ps1
   - El script orquestador ejecutará los pasos de configuración: base de datos, backend, frontend (build de producción) y chatbot. Cada paso registrará su salida en installer\logs\installer_install.log. El orquestador detendrá la instalación si detecta errores críticos.
4. Al finalizar correctamente, usar .\installer\launcher\iniciar_nails_studio.bat para iniciar backend (php artisan serve) y chatbot.
   - NOTA: El frontend en producción debe ser servido por Apache/AMMPS apuntando a back-end\public\spa. Configure Apache/AMMPS según la documentación de su entorno para que DocumentRoot sirva la carpeta spa o crear un VirtualHost apuntando a back-end\public\spa.

Notas sobre WhatsApp
--------------------
- La vinculación de WhatsApp (QR) es manual: tras iniciar el chatbot, la terminal mostrará la información/QR si es necesario.

Archivos importantes
-------------------
- installer/MC_NAILS_STUDIO.iss  -> Script Inno Setup (plantilla)
- installer/scripts/verificar-requisitos.ps1
- installer/scripts/instalar.ps1
- installer/scripts/configurar-base-datos.ps1
- installer/scripts/configurar-backend.ps1
- installer/scripts/configurar-frontend.ps1
- installer/scripts/configurar-chatbot.ps1
- installer/launcher/iniciar_nails_studio.bat
- installer/launcher/detener_nails_studio.bat

Logs
----
- installer/logs/installer_install.log

Soporte
-------
Si algo falla, revisar los logs en installer/logs/ y compartirlos con el equipo de desarrollo.
