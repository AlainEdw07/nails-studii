# Back-end Integration Test Documentation

## Objetivo
Documentar cómo ejecutar y mantener las pruebas de integración y funcionales del back-end Laravel.

## Requisitos previos
- PHP instalado.
- Extensiones habilitadas: `pdo_sqlite`, `sqlite3`.
- Dependencias instaladas: `composer install`.

## Configuración de pruebas
Laravel usa PHPUnit/Pest para ejecutar pruebas.

### Variables de entorno de prueba
El archivo `phpunit.xml` ya configura el entorno:
- `APP_ENV=testing`
- `DB_CONNECTION=sqlite`
- `DB_DATABASE=:memory:`
- `MAIL_MAILER=array`
- `QUEUE_CONNECTION=sync`
- `SESSION_DRIVER=array`

### JWT en pruebas
Algunas pruebas necesitan un secreto JWT válido. Las pruebas de características configuran `jwt.secret` usando una clave de 32 caracteres en el bootstrap de cada archivo.

## Ejecutar pruebas
Desde el directorio `back-end`:

```bash
php artisan test
```

Para ejecutar un solo archivo de prueba:

```bash
php artisan test --filter AuthControllerTest
```

## Archivos de prueba relevantes
Las pruebas de integración se encuentran en `back-end/tests/Feature/`:

- `AuthControllerTest.php`
- `CitaControllerTest.php`
- `HorarioDisponibleControllerTest.php`
- `PreguntaChatbotControllerTest.php`
- `ResenaControllerTest.php`
- `ServicioControllerTest.php`
- `ReplicateControllerTest.php`

También hay pruebas unitarias en `back-end/tests/Unit/`.

## Resultados esperados
- Todas las pruebas deben pasar con `php artisan test`.
- El comando final debe retornar `passed` y no mostrar fallos.

## Actualizaciones recientes
- Se solucionó el error de JWT usando una clave de prueba de 32 bytes.
- Se corrigieron aserciones JSON en pruebas que esperaban conteos exactos en respuestas con más datos.
- Se arregló la prueba unitaria del validador usando `Validator::make()` en lugar de `validator()`.
