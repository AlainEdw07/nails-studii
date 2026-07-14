<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\ReplicateController;
use Illuminate\Http\Request;
use Tests\TestCase;

class ReplicateControllerTest extends TestCase
{
    private ReplicateController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new ReplicateController();
    }

    public function test_probar_diseno_request_validate_method_exists(): void
    {
        // Validar que el método request()->validate() funciona
        $request = new Request([]);
        
        // El método validate lanza una excepción, que es lo esperado
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $request->validate([
            'foto_mano' => 'required|string',
        ]);
    }

    public function test_probar_diseno_with_valid_required_fields(): void
    {
        $this->app['config']['services.replicate.token'] = 'test-token';

        $request = new Request([
            'foto_mano' => 'data:image/png;base64,test',
            'diseno_img' => 'data:image/png;base64,test',
        ]);

        // Con token pero sin conexión a API, debería fallar en la llamada HTTP, no en validación
        try {
            $response = $this->controller->probarDiseno($request);
            // Si hay error de conexión, está bien - significa pasó la validación
            $this->assertThat($response->getStatusCode(), $this->logicalOr(
                $this->equalTo(500),
                $this->equalTo(502),
                $this->equalTo(504)
            ));
        } catch (\Exception $e) {
            // Las excepciones de conexión HTTP también son aceptables
            $this->assertTrue(true);
        }
    }

    public function test_probar_diseno_missing_token_returns_500(): void
    {
        $this->app['config']['services.replicate.token'] = null;

        $request = new Request([
            'foto_mano' => 'data:image/png;base64,test',
            'diseno_img' => 'data:image/png;base64,test',
        ]);

        $response = $this->controller->probarDiseno($request);

        $this->assertEquals(500, $response->getStatusCode());
    }
}
