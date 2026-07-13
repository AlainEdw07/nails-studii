<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\HorarioDisponibleController;
use Illuminate\Http\Request;
use Tests\TestCase;

class HorarioDisponibleControllerTest extends TestCase
{
    private HorarioDisponibleController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new HorarioDisponibleController();
    }

    public function test_store_validates_dia_semana_required(): void
    {
        $request = new Request([
            'hora_inicio' => '09:00',
            'hora_fin' => '18:00',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('dia_semana', $response->getContent());
    }

    public function test_store_validates_invalid_dia_semana(): void
    {
        $request = new Request([
            'dia_semana' => 'Lunas',
            'hora_inicio' => '09:00',
            'hora_fin' => '18:00',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_validates_hora_inicio_required(): void
    {
        $request = new Request([
            'dia_semana' => 'Lunes',
            'hora_fin' => '18:00',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('hora_inicio', $response->getContent());
    }

    public function test_store_validates_hora_fin_required(): void
    {
        $request = new Request([
            'dia_semana' => 'Lunes',
            'hora_inicio' => '09:00',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('hora_fin', $response->getContent());
    }

    public function test_store_validates_invalid_hora_inicio_format(): void
    {
        $request = new Request([
            'dia_semana' => 'Lunes',
            'hora_inicio' => '25:00',
            'hora_fin' => '18:00',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_validates_invalid_hora_fin_format(): void
    {
        $request = new Request([
            'dia_semana' => 'Lunes',
            'hora_inicio' => '09:00',
            'hora_fin' => 'invalid',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_validates_hora_fin_after_inicio(): void
    {
        $request = new Request([
            'dia_semana' => 'Lunes',
            'hora_inicio' => '18:00',
            'hora_fin' => '09:00',
        ]);

        $response = $this->controller->store($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_store_validates_hora_fin_not_equal_to_inicio(): void
    {
        $request = new Request([
            'dia_semana' => 'Lunes',
            'hora_inicio' => '09:00',
            'hora_fin' => '09:00',
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
