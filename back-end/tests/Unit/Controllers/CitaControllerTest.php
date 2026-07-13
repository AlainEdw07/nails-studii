<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\CitaController;
use Illuminate\Http\Request;
use Tests\TestCase;

class CitaControllerTest extends TestCase
{
    private CitaController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new CitaController();
    }

    public function test_store_validates_nombre_cliente_required(): void
    {
        $request = new Request([
            'fecha_cita' => '2026-08-20',
            'hora_cita' => '14:00',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('nombre', $response->getContent());
    }

    public function test_store_validates_fecha_cita_required(): void
    {
        $request = new Request([
            'nombre_cliente' => 'Maria',
            'hora_cita' => '14:00',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('fecha', $response->getContent());
    }

    public function test_store_validates_hora_cita_required(): void
    {
        $request = new Request([
            'nombre_cliente' => 'Maria',
            'fecha_cita' => '2026-08-20',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('hora', $response->getContent());
    }

    public function test_store_validates_fecha_past(): void
    {
        $yesterday = now()->subDay()->format('Y-m-d');

        $request = new Request([
            'nombre_cliente' => 'Maria',
            'fecha_cita' => $yesterday,
            'hora_cita' => '14:00',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_validates_invalid_hora_format(): void
    {
        $request = new Request([
            'nombre_cliente' => 'Maria',
            'fecha_cita' => '2026-08-20',
            'hora_cita' => '25:00',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_validates_invalid_email(): void
    {
        $request = new Request([
            'nombre_cliente' => 'Maria',
            'correo' => 'not-an-email',
            'fecha_cita' => '2026-08-20',
            'hora_cita' => '14:00',
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
