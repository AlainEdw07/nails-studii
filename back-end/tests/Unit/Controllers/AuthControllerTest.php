<?php

namespace Tests\Unit\Controllers;

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    private AuthController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new AuthController();
    }

    public function test_login_validates_correo_required(): void
    {
        $request = new Request([
            'contrasena' => 'password',
        ]);

        $response = $this->controller->login($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('correo', $response->getContent());
    }

    public function test_login_validates_contrasena_required(): void
    {
        $request = new Request([
            'correo' => 'admin@example.com',
        ]);

        $response = $this->controller->login($request);

        $this->assertEquals(422, $response->getStatusCode());
        $this->assertStringContainsString('contrasena', $response->getContent());
    }

    public function test_login_validates_email_format(): void
    {
        $request = new Request([
            'correo' => 'not-an-email',
            'contrasena' => 'password',
        ]);

        $response = $this->controller->login($request);

        $this->assertEquals(422, $response->getStatusCode());
    }

    public function test_login_response_is_json(): void
    {
        $request = new Request([]);
        $response = $this->controller->login($request);

        $this->assertEquals('application/json', $response->headers->get('Content-Type'));
    }

    public function test_login_error_response_has_mensaje_and_errores(): void
    {
        $request = new Request([]);
        $response = $this->controller->login($request);

        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('mensaje', $data);
        $this->assertArrayHasKey('errores', $data);
    }
}
