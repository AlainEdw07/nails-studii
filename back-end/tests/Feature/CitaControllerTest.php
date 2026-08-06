<?php

use App\Models\Cita;
use App\Models\Servicio;
use App\Models\Administrador;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

beforeEach(function () {
    config(['jwt.secret' => str_repeat('a', 32)]);
});

function createAdminCita(): Administrador
{
    return Administrador::create([
        'nombre_usuario' => 'admin',
        'correo' => 'admin@example.com',
        'contrasena' => 'secret',
    ]);
}

function createServicio(): Servicio
{
    return Servicio::create([
        'nombre' => 'Manicure Deluxe',
        'descripcion' => 'Servicio de manicure completo',
        'precio' => 35.50,
        'duracion_estimada' => 60,
        'imagen_principal' => null,
        'estado' => 'activo',
    ]);
}

test('public can create cita successfully', function () {
    $servicio = createServicio();

    $response = $this->postJson('/api/v1/citas', [
        'nombre_cliente' => 'Ana Pérez',
        'telefono' => '1234567890',
        'correo' => 'ana@example.com',
        'servicio_id' => $servicio->id,
        'fecha_cita' => now()->addDay()->format('Y-m-d'),
        'hora_cita' => '10:30',
        'notas_adicionales' => 'Prefiere manos sin esmalte',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('mensaje', 'Cita creada correctamente.')
        ->assertJsonStructure(['mensaje', 'cita' => ['id', 'nombre_cliente', 'telefono', 'correo', 'servicio_id', 'fecha_cita', 'hora_cita', 'notas_adicionales', 'estado']]);

    $this->assertDatabaseHas('citas', [
        'nombre_cliente' => 'Ana Pérez',
        'correo' => 'ana@example.com',
        'estado' => 'pendiente',
    ]);
});

test('admin can view citas index', function () {
    $admin = createAdminCita();
    $servicio = createServicio();

    Cita::create([
        'nombre_cliente' => 'Cliente Uno',
        'telefono' => '3216549870',
        'correo' => 'cliente1@example.com',
        'servicio_id' => $servicio->id,
        'fecha_cita' => now()->addDay()->format('Y-m-d'),
        'hora_cita' => '12:00',
        'notas_adicionales' => 'Sin observaciones',
        'estado' => 'pendiente',
    ]);

    $login = $this->postJson('/api/v1/admin/login', [
        'correo' => $admin->correo,
        'contrasena' => 'secret',
    ]);

    $token = $login->json('token');

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/admin/citas');

    $response->assertStatus(200)
        ->assertJsonStructure(['citas'])
        ->assertJsonCount(1, 'citas');
});
