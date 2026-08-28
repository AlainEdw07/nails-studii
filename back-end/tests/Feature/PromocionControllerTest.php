<?php

use App\Models\Administrador;
use App\Models\Promocion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['jwt.secret' => str_repeat('a', 32)]);
});

function createAdminPromo(): Administrador
{
    return Administrador::create([
        'nombre_usuario' => 'admin_promo',
        'correo' => 'adminpromo@example.com',
        'contrasena' => 'secret',
    ]);
}

test('admin can create show update delete and send whatsapp for promocion', function () {
    $admin = createAdminPromo();

    $login = $this->postJson('/api/v1/admin/login', [
        'correo' => $admin->correo,
        'contrasena' => 'secret',
    ]);

    $token = $login->json('token');

    // 1. Create promo
    $create = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/admin/promociones', [
            'nombre' => 'Promo Verano 2026',
            'descripcion' => 'Descuento especial de verano',
            'tipo_descuento' => 'porcentaje',
            'valor_descuento' => 20,
            'fecha_inicio' => '2026-08-01',
            'fecha_fin' => '2026-08-31',
            'codigo_promocional' => 'VERANO26',
            'frecuencia_whatsapp' => 'semanal',
            'aplica_todos_servicios' => true,
        ]);

    $create->assertStatus(201)
        ->assertJsonPath('promocion.nombre', 'Promo Verano 2026')
        ->assertJsonPath('promocion.frecuencia_whatsapp', 'semanal');

    $promoId = $create->json('promocion.id');

    // 2. Show promo
    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson("/api/v1/admin/promociones/{$promoId}")
        ->assertStatus(200)
        ->assertJsonPath('promocion.codigo_promocional', 'VERANO26');

    // 3. Update promo
    $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/v1/admin/promociones/{$promoId}", [
            'valor_descuento' => 25,
            'frecuencia_whatsapp' => 'quincenal',
        ])
        ->assertStatus(200)
        ->assertJsonPath('promocion.valor_descuento', '25.00')
        ->assertJsonPath('promocion.frecuencia_whatsapp', 'quincenal');

    // 4. Send WhatsApp promo
    $send = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/v1/admin/promociones/{$promoId}/enviar-whatsapp", [
            'frecuencia_whatsapp' => 'semanal',
        ]);

    $send->assertStatus(200)
        ->assertJsonPath('frecuencia_programada', 'semanal');

    // 5. Delete promo
    $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/v1/admin/promociones/{$promoId}")
        ->assertStatus(200)
        ->assertJson(['mensaje' => 'Promoción eliminada correctamente.']);

    $this->assertDatabaseMissing('promociones', ['id' => $promoId]);
});
