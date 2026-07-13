<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\ResenaController;
use Illuminate\Http\Request;
use Tests\TestCase;

class ResenaControllerTest extends TestCase
{
    private ResenaController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new ResenaController();
    }

    public function test_store_validates_nombre_cliente_required(): void
    {
        $request = new Request([
            'calificacion' => 4,
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('nombre', $response->getContent());
    }

    public function test_store_validates_calificacion_required(): void
    {
        $request = new Request([
            'nombre_cliente' => 'Carlos',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('calificacion', $response->getContent());
    }

    public function test_store_validates_calificacion_min(): void
    {
        $request = new Request([
            'nombre_cliente' => 'Carlos',
            'calificacion' => 0,
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_validates_calificacion_max(): void
    {
        $request = new Request([
            'nombre_cliente' => 'Carlos',
            'calificacion' => 6,
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_validates_calificacion_type(): void
    {
        $request = new Request([
            'nombre_cliente' => 'Carlos',
            'calificacion' => 'invalid',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_response_is_json(): void
    {
        $request = new Request([]);
        $response = $this->controller->store($request);

        $this->assertEquals('application/json', $response->headers->get('Content-Type'));
    }

    public function test_store_error_has_mensaje_and_errores(): void
    {
        $request = new Request([]);
        $response = $this->controller->store($request);

        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('mensaje', $data);
        $this->assertArrayHasKey('errores', $data);
    }
}
