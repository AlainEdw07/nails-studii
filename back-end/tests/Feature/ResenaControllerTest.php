<?php

use App\Models\Administrador;
use App\Models\Resena;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

beforeEach(function () {
    config(['jwt.secret' => str_repeat('a', 32)]);
});

function createAdminResena(): Administrador
{
    return Administrador::create([
        'nombre_usuario' => 'admin',
        'correo' => 'admin@example.com',
        'contrasena' => 'secret',
    ]);
}

test('public can submit resena', function () {
    $response = $this->postJson('/api/v1/resenas', [
        'nombre_cliente' => 'María',
        'comentario' => 'Excelente servicio',
        'calificacion' => 5,
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('mensaje', 'Reseña enviada correctamente. Será visible cuando sea aprobada.')
        ->assertJsonPath('resena.nombre_cliente', 'María');

    $this->assertDatabaseHas('resenas', [
        'nombre_cliente' => 'María',
        'calificacion' => 5,
        'estado_aprobacion' => 'pendiente',
    ]);
});

test('public can list approved resenas', function () {
    Resena::create([
        'nombre_cliente' => 'Cliente Aprobado',
        'comentario' => 'Muy buen servicio',
        'calificacion' => 5,
        'estado_aprobacion' => 'aprobado',
        'fecha' => now(),
    ]);

    Resena::create([
        'nombre_cliente' => 'Cliente Pendiente',
        'comentario' => 'Pendiente',
        'calificacion' => 4,
        'estado_aprobacion' => 'pendiente',
        'fecha' => now(),
    ]);

    $response = $this->getJson('/api/v1/resenas');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'resenas')
        ->assertJsonPath('resenas.0.nombre_cliente', 'Cliente Aprobado');
});

test('admin can list resenas admin', function () {
    $admin = createAdminResena();

    Resena::create([
        'nombre_cliente' => 'Cliente Admin',
        'comentario' => 'Comentario admin',
        'calificacion' => 4,
        'estado_aprobacion' => 'pendiente',
        'fecha' => now(),
    ]);

    $login = $this->postJson('/api/v1/admin/login', [
        'correo' => $admin->correo,
        'contrasena' => 'secret',
    ]);

    $token = $login->json('token');

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/admin/resenas');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'resenas');
});

test('admin can update and delete resena', function () {
    $admin = createAdminResena();

    $resena = Resena::create([
        'nombre_cliente' => 'Cliente Actualizar',
        'comentario' => 'Comentario viejo',
        'calificacion' => 3,
        'estado_aprobacion' => 'pendiente',
        'fecha' => now(),
    ]);

    $login = $this->postJson('/api/v1/admin/login', [
        'correo' => $admin->correo,
        'contrasena' => 'secret',
    ]);

    $token = $login->json('token');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/v1/admin/resenas/{$resena->id}", [
            'estado_aprobacion' => 'aprobado',
        ])
        ->assertStatus(200)
        ->assertJsonPath('resena.estado_aprobacion', 'aprobado');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/v1/admin/resenas/{$resena->id}")
        ->assertStatus(200)
        ->assertJson(['mensaje' => 'Reseña eliminada correctamente.']);

    $this->assertDatabaseMissing('resenas', ['id' => $resena->id]);
});
