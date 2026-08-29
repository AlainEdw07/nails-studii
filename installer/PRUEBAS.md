PRUEBAS DE VALIDACIÓN - Nails Studio (instalador)

Objetivo: verificar que, tras ejecutar el instalador y los scripts de configuración, el sistema funciona end-to-end: frontend, backend, chatbot y MySQL.

Antes de empezar: ejecutar los pasos de instalación (o ejecutar el instalador NailsStudio_Setup.exe) y ejecutar el script de validación installer\scripts\validar_instalacion.ps1 (si existe). Si no existe, realizar las comprobaciones manuales siguientes.

1) Verificar MySQL
Acción: Abrir PowerShell y ejecutar (desde cualquier carpeta):
    mysql -u <user> -p -h <host> -P <port>
Resultado esperado: se conecta y muestra prompt de MySQL. Si falla: revisar credenciales y servicio MySQL.

2) Verificar backend Laravel
- Desde la carpeta de instalación del backend (por ejemplo C:\NailsStudio\back-end):
    composer install
    php artisan key:generate
    php artisan migrate --force
Resultado esperado: Composer instala dependencias; artisan genera clave y migraciones crean tablas. Si falla: revisar PHP en PATH y extensión pdo_mysql.

3) Verificar frontend construido
- Desde la carpeta de instalación front-end (por ejemplo C:\NailsStudio\front-end):
    npm install
    npm run build
Resultado esperado: Se genera carpeta de salida (según front-end/angular.json -> outputPath: "www"). El contenido 'www' debe existir y contener index.html.

4) Verificar chatbot
- Desde carpeta C:\NailsStudio\base-ts-baileys-memory:
    npm install
    npm run build
    node ./dist/app.js
Resultado esperado: El bot intenta arrancar y muestra logs en consola; si requiere QR, muestra o expone el QR (paso manual). Si falla: revisar Node/npm en PATH y dependencias.

5) Probar comunicación frontend -> backend
- Abrir navegador y acceder a la carpeta estática del frontend (si se copia a Laravel public o se sirve con un static server) y comprobar que las llamadas a http://localhost:8000/api/v1 respondan.
- Comando de prueba con curl (ejemplo):
    curl http://localhost:8000/api/v1/servicios
Resultado esperado: JSON con servicios (200). Si 401: revisar tokens/JWT. Si 404/500: revisar rutas y backend logs.

6) Probar login administrativo (si existe usuario seed)
- Intentar login con credenciales definidas en migrations/seed (2026_06_06_000001_seed_default_admin.php):
    email: admin@nailsstudio.com
    password: NailsAdmin!2026#Strong
Resultado esperado: login exitoso y recepción de token JWT en respuesta. Si falla: revisar seeders y migraciones, verificar contraseña en el seeder.

7) Probar chatbot -> backend
- Con bot iniciado, realizar una acción que provoque llamada al endpoint backend (p.ej crear una cita) y verificar en backend logs/migrations que la cita fue creada. Resultado esperado: la API recibe y persiste datos en MySQL.

8) Verificar logs y estados
- Revisar archivos de log en {InstallDir}\logs y storage/logs (backend) para errores.

9) Comprobación de puertos
- Verificar que no hay conflictos en puertos (laravel by default 8000, frontend dev server 4200, chatbot PORT configurado en .env). Usar:
    netstat -ano | findstr :8000

10) Script de validación (recomendado)
- Permitir que installer scripts incluyan o generen installer\scripts\validar_instalacion.ps1 que ejecute las pruebas 1..7 automáticamente y devuelva código de salida 0 si tiene éxito.

Si alguna prueba falla, documentar la salida exacta y consultar los logs en storage/logs/laravel.log y en la consola del chatbot. Mantener el instalador en modo verbose para reunir información.
