<?php

use App\Models\Administrador;
use App\Models\HorarioDisponible;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

beforeEach(function () {
    config(['jwt.secret' => str_repeat('a', 32)]);
});

function createAdminHorario(): Administrador
{
    return Administrador::create([
        'nombre_usuario' => 'admin',
        'correo' => 'admin@example.com',
        'contrasena' => 'secret',
    ]);
}

test('public can list horarios disponibles', function () {
    HorarioDisponible::create([
        'dia_semana' => 'Lunes',
        'hora_inicio' => '09:00',
        'hora_fin' => '13:00',
        'activo' => true,
    ]);

    $response = $this->getJson('/api/v1/horarios/disponibles');

    $response->assertStatus(200)
        ->assertJsonStructure(['horarios_disponibles'])
        ->assertJsonFragment([
            'dia_semana' => 'Lunes',
            'hora_inicio' => '09:00',
            'hora_fin' => '13:00',
        ]);
});

test('admin can store horario disponible', function () {
    $admin = createAdminHorario();

    $login = $this->postJson('/api/v1/admin/login', [
        'correo' => $admin->correo,
        'contrasena' => 'secret',
    ]);

    $token = $login->json('token');

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/admin/horarios', [
            'dia_semana' => 'Martes',
            'hora_inicio' => '10:00',
            'hora_fin' => '14:00',
            'activo' => true,
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('mensaje', 'Horario disponible creado correctamente.')
        ->assertJsonPath('horario_disponible.dia_semana', 'Martes');

    $this->assertDatabaseHas('horarios_disponibles', [
        'dia_semana' => 'Martes',
        'hora_inicio' => '10:00',
    ]);
});
