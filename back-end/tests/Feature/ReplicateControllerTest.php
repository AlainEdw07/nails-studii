<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config(['services.replicate.token' => null]);
});

test('replicate service returns 500 when token is not configured', function () {
    Http::fake();

    $response = $this->postJson('/api/v1/replicate/probar-diseno', [
        'foto_mano' => 'data:image/png;base64,AAA',
        'diseno_img' => 'data:image/png;base64,BBB',
    ]);

    $response->assertStatus(500)
        ->assertJson(['error' => 'Replicate API token no configurado.']);
});

test('replicate validation fails when required fields are missing', function () {
    Http::fake();

    $response = $this->postJson('/api/v1/replicate/probar-diseno', []);

    $response->assertStatus(422)
        ->assertJsonStructure(['message', 'errors']);
});
