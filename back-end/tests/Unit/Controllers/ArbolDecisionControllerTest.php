<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\ArbolDecisionController;
use Illuminate\Http\Request;
use Tests\TestCase;

class ArbolDecisionControllerTest extends TestCase
{
    private ArbolDecisionController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new ArbolDecisionController();
    }

    public function test_obtener_arbol_decision_validates_required_fecha(): void
    {
        $request = new Request([]);
        $response = $this->controller->obtenerArbolDecision($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('fecha', $response->getContent());
    }

    public function test_obtener_arbol_decision_validates_fecha_must_be_future(): void
    {
        $request = new Request([
            'fecha' => '2020-01-01',
        ]);
        $response = $this->controller->obtenerArbolDecision($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_calcular_precio_validates_required_servicio_id(): void
    {
        $request = new Request([]);
        $response = $this->controller->calcularPrecio($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('servicio_id', $response->getContent());
    }
}
