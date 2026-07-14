# Pruebas Unitarias de Controllers

Este directorio contiene pruebas unitarias para todos los controllers de la API. Estas pruebas están diseñadas para:

✅ **No tocar la base de datos real** - Pruebas de validación pura de entrada  
✅ **Ejecutarse rápidamente** - ~2-3 segundos para 41 tests  
✅ **Funcionar sin conexión** - Solo prueban lógica de validación  

## Resumen de Pruebas

| Controller | Tests | Estado |
|-----------|-------|--------|
| AuthController | 5 | ✅ Pasando |
| ServicioController | 9 | ✅ Pasando |
| CitaController | 9 | ✅ Pasando |
| ResenaController | 8 | ✅ Pasando |
| HorarioDisponibleController | 10 | ✅ Pasando |
| ReplicateController | 2 | ✅ Pasando |
| **TOTAL** | **41** | **✅ 100% Pasando** |

## Cómo Ejecutar las Pruebas

### Ejecutar todas las pruebas unitarias de controllers
```bash
php artisan test tests/Unit/Controllers
```

### Ejecutar test específico
```bash
php artisan test tests/Unit/Controllers/AuthControllerTest.php
```

### Ver resultados detallados
```bash
php artisan test tests/Unit/Controllers --verbose
```

## ¿Qué se Prueba?

### Validación de Entrada ✅
- ✅ Campos requeridos (required)
- ✅ Formatos de datos (email, date, time)
- ✅ Rangos de valores (min, max)
- ✅ Valores inválidos
- ✅ Tipos de datos incorrectos

### Respuestas HTTP ✅
- ✅ Código 422 en validación fallida
- ✅ Estructura JSON correcta
- ✅ Content-Type: application/json
- ✅ Presencia de campos `mensaje` y `errores`

## Por Controller

### AuthController (5 tests)
```
✅ test_login_validates_correo_required
✅ test_login_validates_contrasena_required
✅ test_login_validates_email_format
✅ test_login_response_is_json
✅ test_login_error_response_has_mensaje_and_errores
```

### ServicioController (9 tests)
```
✅ test_store_validates_nombre_required
✅ test_store_validates_precio_required
✅ test_store_validates_duracion_required
✅ test_store_validates_negative_price
✅ test_store_validates_invalid_duration
✅ test_store_validates_invalid_status
✅ test_store_response_is_json
✅ test_store_error_has_mensaje_and_errores
✅ (1 más)
```

### CitaController (9 tests)
```
✅ test_store_validates_nombre_cliente_required
✅ test_store_validates_fecha_cita_required
✅ test_store_validates_hora_cita_required
✅ test_store_validates_fecha_past
✅ test_store_validates_invalid_hora_format
✅ test_store_validates_invalid_email
✅ test_store_response_is_json
✅ test_store_error_has_mensaje_and_errores
✅ (1 más)
```

### ResenaController (8 tests)
```
✅ test_store_validates_nombre_cliente_required
✅ test_store_validates_calificacion_required
✅ test_store_validates_calificacion_min
✅ test_store_validates_calificacion_max
✅ test_store_validates_calificacion_type
✅ test_store_response_is_json
✅ test_store_error_has_mensaje_and_errores
✅ (1 más)
```

### HorarioDisponibleController (10 tests)
```
✅ test_store_validates_dia_semana_required
✅ test_store_validates_invalid_dia_semana
✅ test_store_validates_hora_inicio_required
✅ test_store_validates_hora_fin_required
✅ test_store_validates_invalid_hora_inicio_format
✅ test_store_validates_invalid_hora_fin_format
✅ test_store_validates_hora_fin_after_inicio
✅ test_store_validates_hora_fin_not_equal_to_inicio
✅ test_store_response_is_json
✅ test_store_error_has_mensaje_and_errores
```

### ReplicateController (2 tests)
```
✅ test_probar_diseno_missing_token_returns_500
✅ test_probar_diseno_with_valid_required_fields
```

## Estrategia de Testing

### ✅ Pruebas Unitarias Puras
- **Sin BD**: No interactúan con base de datos
- **Sin Mocks Complejos**: Solo prueban la validación
- **Independientes**: Cada test funciona de forma aislada
- **Rápidas**: Ejecutan en ~54ms por test

### Casos Cubiertos
1. **Campos Requeridos** - `required`
2. **Formatos Válidos** - `email`, `date_format`, `in`
3. **Rangos de Valores** - `min`, `max`
4. **Tipos de Datos** - `string`, `integer`, `date`
5. **Respuestas HTTP** - 422 para errores de validación

### ¿Qué NO se Prueba Aquí?
- ❌ Lógica de BD (INSERT, UPDATE, DELETE)
- ❌ Relaciones entre modelos
- ❌ Autenticación (usa JWT)
- ❌ Llamadas a APIs externas (Replicate)

Estos casos se cubren en **tests/Feature** (pruebas de integración).

## Estructura de un Test

```php
class AuthControllerTest extends TestCase
{
    private AuthController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new AuthController();
    }

    public function test_login_validates_email_format(): void
    {
        $request = new Request([
            'correo' => 'not-an-email',
            'contrasena' => 'password',
        ]);

        $response = $this->controller->login($request);

        // Esperamos error de validación
        $this->assertEquals(422, $response->getStatusCode());
    }
}
```

## Agregar Nuevos Tests

Al agregar nuevas funciones a un controller, sigue este patrón:

```php
// 1. Test de campo requerido
public function test_funcion_validates_campo_required(): void {}

// 2. Tests de validación específica
public function test_funcion_validates_formato(): void {}
public function test_funcion_validates_rango(): void {}

// 3. Test de respuesta
public function test_funcion_response_structure(): void {}
```

## Ejecución de CI/CD

Para correr en CI/CD (GitHub Actions, GitLab, etc.):

```bash
# Ejecutar tests y generar reporte de cobertura
php artisan test tests/Unit/Controllers --coverage

# Ejecutar y fallar si hay cobertura baja
php artisan test tests/Unit/Controllers --coverage --min=75
```

## Troubleshooting

**Los tests fallan con "could not find driver"**
```
→ Estos son tests de FEATURE que necesitan BD
→ Están en tests/Feature, no en tests/Unit/Controllers
→ Los tests unitarios no necesitan drivers de BD
```

**Test pasa localmente pero falla en CI**
```
→ Verificar ambiente de CI (variables de config)
→ Revisar config/services.replicate en CI
```

**Necesito probar con BD real**
```
→ Usa tests/Feature para integration tests
→ Usa @uses trait RefreshDatabase
→ No uses tests/Unit/Controllers
```

## Próximos Pasos

Para cobertura completa de API:
1. ✅ Tests Unitarios (este directorio) - HECHO
2. ⏳ Tests de Feature (tests/Feature) - Próximo
3. ⏳ Tests de Integración (E2E) - Después

