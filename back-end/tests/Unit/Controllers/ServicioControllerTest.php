<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\ServicioController;
use Illuminate\Http\Request;
use Tests\TestCase;

class ServicioControllerTest extends TestCase
{
    private ServicioController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new ServicioController();
    }

    public function test_store_validates_nombre_required(): void
    {
        $request = new Request([
            'precio' => 25.00,
            'duracion_estimada' => 60,
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('nombre', $response->getContent());
    }

    public function test_store_validates_precio_required(): void
    {
        $request = new Request([
            'nombre' => 'Manicura',
            'duracion_estimada' => 60,
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('precio', $response->getContent());
    }

    public function test_store_validates_duracion_required(): void
    {
        $request = new Request([
            'nombre' => 'Manicura',
            'precio' => 25.00,
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('duracion_estimada', $response->getContent());
    }

    public function test_store_validates_negative_price(): void
    {
        $request = new Request([
            'nombre' => 'Manicura',
            'precio' => -10.00,
            'duracion_estimada' => 60,
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_validates_invalid_duration(): void
    {
        $request = new Request([
            'nombre' => 'Manicura',
            'precio' => 25.00,
            'duracion_estimada' => 0,
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_validates_invalid_status(): void
    {
        $request = new Request([
            'nombre' => 'Manicura',
            'precio' => 25.00,
            'duracion_estimada' => 60,
            'estado' => 'invalid',
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
