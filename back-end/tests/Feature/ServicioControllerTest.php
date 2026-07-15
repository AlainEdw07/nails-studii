<?php

use App\Models\Administrador;
use App\Models\Servicio;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

beforeEach(function () {
    config(['jwt.secret' => str_repeat('a', 32)]);
});

function createAdminServicio(): Administrador
{
    return Administrador::create([
        'nombre_usuario' => 'admin',
        'correo' => 'admin@example.com',
        'contrasena' => 'secret',
    ]);
}

test('public can list only active servicios', function () {
    Servicio::create([
        'nombre' => 'Activo',
        'descripcion' => 'Activo',
        'precio' => 15.00,
        'duracion_estimada' => 30,
        'imagen_principal' => null,
        'estado' => 'activo',
    ]);

    Servicio::create([
        'nombre' => 'Inactivo',
        'descripcion' => 'Inactivo',
        'precio' => 10.00,
        'duracion_estimada' => 20,
        'imagen_principal' => null,
        'estado' => 'inactivo',
    ]);

    $response = $this->getJson('/api/v1/servicios');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'nombre' => 'Activo',
        ])
        ->assertJsonMissing([
            'nombre' => 'Inactivo',
        ]);
});

test('admin can create show update and delete servicio', function () {
    $admin = createAdminServicio();

    $login = $this->postJson('/api/v1/admin/login', [
        'correo' => $admin->correo,
        'contrasena' => 'secret',
    ]);

    $token = $login->json('token');

    $create = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/admin/servicios', [
            'nombre' => 'Servicio Test',
            'descripcion' => 'Descripción',
            'precio' => 50.00,
            'duracion_estimada' => 45,
            'estado' => 'activo',
        ]);

    $create->assertStatus(201)
        ->assertJsonPath('servicio.nombre', 'Servicio Test');

    $servicioId = $create->json('servicio.id');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson("/api/v1/admin/servicios/{$servicioId}")
        ->assertStatus(200)
        ->assertJsonPath('servicio.nombre', 'Servicio Test');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/v1/admin/servicios/{$servicioId}", [
            'precio' => 55.00,
        ])
        ->assertStatus(200)
        ->assertJsonPath('servicio.precio', '55.00');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/v1/admin/servicios/{$servicioId}")
        ->assertStatus(200)
        ->assertJson(['mensaje' => 'Servicio eliminado correctamente.']);

    $this->assertDatabaseMissing('servicios', ['id' => $servicioId]);
});
