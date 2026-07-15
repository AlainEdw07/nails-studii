<?php

use App\Models\Administrador;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

beforeEach(function () {
    config(['jwt.secret' => str_repeat('a', 32)]);
});

function createAdmin(): Administrador
{
    return Administrador::create([
        'nombre_usuario' => 'admin',
        'correo' => 'admin@example.com',
        'contrasena' => 'secret',
    ]);
}

test('admin can login with valid credentials', function () {
    createAdmin();

    $response = $this->postJson('/api/v1/admin/login', [
        'correo' => 'admin@example.com',
        'contrasena' => 'secret',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'mensaje',
            'token',
            'tipo_token',
            'expires_in',
            'administrador',
        ]);
});

test('admin can access perfil with bearer token', function () {
    createAdmin();

    $login = $this->postJson('/api/v1/admin/login', [
        'correo' => 'admin@example.com',
        'contrasena' => 'secret',
    ]);

    $token = $login->json('token');

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/admin/perfil');

    $response->assertStatus(200)
        ->assertJsonPath('administrador.correo', 'admin@example.com');
});

test('admin can refresh token', function () {
    createAdmin();

    $login = $this->postJson('/api/v1/admin/login', [
        'correo' => 'admin@example.com',
        'contrasena' => 'secret',
    ]);

    $token = $login->json('token');

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/admin/refresh');

    $response->assertStatus(200)
        ->assertJsonStructure(['mensaje', 'token', 'tipo_token', 'expires_in', 'administrador']);
});

test('admin can logout successfully', function () {
    createAdmin();

    $login = $this->postJson('/api/v1/admin/login', [
        'correo' => 'admin@example.com',
        'contrasena' => 'secret',
    ]);

    $token = $login->json('token');

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/admin/logout');

    $response->assertStatus(200)
        ->assertJson(['mensaje' => 'Sesión cerrada correctamente.']);
});
