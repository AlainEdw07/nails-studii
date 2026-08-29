REQUISITOS PARA EL INSTALADOR - Nails Studio

Resumen de requisitos detectados en el repositorio (validados contra código real):

Requisitos de software (mínimos detectados):
- Windows 10/11 (64-bit) - plataforma objetivo del instalador.
- PHP: >= 8.3 (requerido por back-end: consultado en back-end/composer.json: "php": "^8.3").
- Composer: necesario para instalar dependencias PHP (composer install).
- Extensiones PHP requeridas: pdo_mysql y extensiones de Laravel (ver back-end/composer.json y config); pdo_mysql es obligatorio para MySQL.
- MySQL/MariaDB: motor de base de datos. Puerto por defecto 3306. Nombre de base de datos configurable.
- Node.js: requerido para frontend (Angular/Ionic) y chatbot (BuilderBot/Baileys). Versión exacta NO está especificada en repository (DATO POR CONFIRMAR). El proyecto usa Angular 20 / Ionic 8 y TypeScript ~5.9 (ver front-end/package.json), lo indica que Node 18+ es normalmente compatible, pero la versión exacta debe confirmarse antes de producción.
- npm: gestor de paquetes para Node.js. Version compatible con la versión de Node.js (DATO POR CONFIRMAR).
- Angular / Ionic / Capacitor: dependencias listadas en front-end/package.json (Angular ^20, Ionic ^8, Capacitor 8). No se fuerza una versión de Node en package.json.
- Git: no es estrictamente necesario para ejecutar el instalador si se prepara un paquete, pero es útil para desarrolladores.

Versiones extraídas del repo:
- Backend PHP requirement: ^8.3 (back-end/composer.json)
- Laravel framework: ^13.8 (back-end/composer.json)
- Frontend Angular: ^20.0.0 (front-end/package.json)
- Ionic: ^8.0.0 (front-end/package.json)
- Capacitor: 8.x (front-end/package.json)
- TypeScript (frontend): ~5.9.0 (front-end/devDependencies)
- Chatbot dependencies: @builderbot/bot 1.4.2, @builderbot/provider-baileys 1.4.2, dotenv ^16.1.4 (base-ts-baileys-memory/package.json)

Comprobaciones automatizadas incluidas en verificar-requisitos.ps1:
- Detecta PHP y verifica que la versión sea >= 8.3 (parsed from php -v).
- Detecta si la extensión pdo_mysql está habilitada (php -m).
- Detecta Composer, Node, npm y cliente mysql.
- No fuerza una versión mínima de Node/npm porque el repositorio no especifica engines — sólo muestra la versión detectada.

Decisión tomada para el instalador:
- Instalar dependencias en la máquina destino (composer install, npm install) durante la instalación.
- Copiar el build del frontend (outputPath www) al backend/public/spa para servir con Apache/AMMPS.

Datos por confirmar (no inventados):
- Versión exacta de Node.js y npm requerida para Angular 20 / Ionic 8 (recomendar probar Node 18/20 en un entorno de staging).
Requisitos hardware (recomendación básica):
- CPU: 2 cores mínimo (4+ recomendado para builds).
- RAM: 8 GB mínimo (16 GB recomendado para builds y para ejecutar servicios simultáneos).
- Espacio en disco: 10+ GB libre (más si se incluye node_modules/vendor o builds locales).

Notas y datos por confirmar (no inventados):
- Node.js / npm versión exacta compatible con Angular 20, Ionic 8 y BuilderBot: DATO POR CONFIRMAR.
- Si se desea una implementación de backend con Apache/AMMPS (en lugar de php artisan serve), la versión exacta de AMMPS recomendable debe confirmarse según PHP 8.3 y módulos Apache/PHP disponibles: DATO POR CONFIRMAR.

Decisión tomada para el instalador:
- Estrategia de dependencias: instalar dependencias en la máquina destino durante la instalación (composer install, npm install), en lugar de incluir vendor/ y node_modules en el instalador. Razonamiento: reduce el tamaño del paquete final, evita incluir binarios nativos específicos de sistema, y permite obtener versiones limpias y compatibles en el equipo destino. El instalador verifica conexión a Internet antes de intentar instalar dependencias.

Recomendaciones previas a ejecutar el instalador en una máquina limpia:
1. Asegurar que PHP (>=8.3) esté instalado y en PATH.
2. Instalar Composer y que esté en PATH.
3. Instalar MySQL/MariaDB y crear (o permitir al instalador crear) la base de datos con un usuario que tenga permisos de creación de tablas.
4. Instalar Node.js y npm (versión compatible: DATO POR CONFIRMAR).  
5. Si se desea usar AMMPS/Apache para el backend, instalar una versión de AMMPS que soporte PHP 8.3 (DATO POR CONFIRMAR).

Comprobaciones automáticas efectuadas por los scripts del instalador:
- Existen scripts PowerShell en installer\scripts para verificar presencia de PHP, Composer, Node, npm y cliente mysql.
- El orquestador instalar.ps1 verifica conectividad a Internet y reporta si las instalaciones de dependencias fallan.

Archivos que el instalador no incluye (por seguridad y tamaño):
- node_modules/
- vendor/
- .git/
- archvios .env reales
- sesiones de WhatsApp / tokens
- logs de desarrollo

Si se desea que continúe y actualice los scripts para forzar/indicar una versión recomendada de Node.js (por ejemplo 18/20/22), indique qué versión desea fijar o autorice seleccionar una versión usando nvm-windows (eso sería un paso adicional y lo marcaré explícitamente como DATO POR CONFIRMAR).