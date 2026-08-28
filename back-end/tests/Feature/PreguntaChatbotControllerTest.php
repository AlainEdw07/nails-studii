<?php

use App\Models\HorarioDisponible;
use App\Models\PreguntaChatbot;
use App\Models\Servicio;

beforeEach(function () {
    config(['jwt.secret' => str_repeat('a', 32)]);
});

test('can retrieve chatbot preguntas, servicios, and horarios_disponibles', function () {
    PreguntaChatbot::create([
        'tipo' => 'web',
        'pregunta' => '¿Qué servicio deseas en web?',
        'opciones_respuesta' => json_encode(['Manicure', 'Pedicure']),
        'accion' => 'elegir_servicio',
    ]);

    Servicio::create([
        'nombre' => 'Manicure Express',
        'descripcion' => 'Servicio rápido',
        'precio' => 20.00,
        'duracion_estimada' => 30,
        'imagen_principal' => null,
        'estado' => 'activo',
    ]);

    HorarioDisponible::updateOrCreate(
        ['dia_semana' => 'Jueves'],
        [
            'hora_inicio' => '09:00',
            'hora_fin' => '12:00',
            'activo' => true,
        ]
    );

    $response = $this->getJson('/api/v1/chatbot/preguntas');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'preguntas',
            'servicios',
            'horarios_disponibles',
        ])
        ->assertJsonFragment([
            'pregunta' => '¿Qué servicio deseas en web?',
        ])
        ->assertJsonFragment([
            'nombre' => 'Manicure Express',
        ])
        ->assertJsonFragment([
            'dia_semana' => 'Jueves',
            'hora_inicio' => '09:00',
            'hora_fin' => '12:00',
        ]);
});

test('can filter chatbot preguntas by tipo web and whatsapp', function () {
    PreguntaChatbot::create([
        'tipo' => 'web',
        'pregunta' => 'Pregunta solo para Web',
        'accion' => 'web_only',
    ]);

    PreguntaChatbot::create([
        'tipo' => 'whatsapp',
        'pregunta' => 'Pregunta solo para WhatsApp',
        'accion' => 'whatsapp_only',
    ]);

    PreguntaChatbot::create([
        'tipo' => 'ambos',
        'pregunta' => 'Pregunta para Ambos',
        'accion' => 'ambos_only',
    ]);

    $resWeb = $this->getJson('/api/v1/chatbot/preguntas?tipo=web');
    $resWeb->assertStatus(200)
        ->assertJsonFragment(['pregunta' => 'Pregunta solo para Web'])
        ->assertJsonFragment(['pregunta' => 'Pregunta para Ambos'])
        ->assertJsonMissing(['pregunta' => 'Pregunta solo para WhatsApp']);

    $resWa = $this->getJson('/api/v1/chatbot/preguntas?tipo=whatsapp');
    $resWa->assertStatus(200)
        ->assertJsonFragment(['pregunta' => 'Pregunta solo para WhatsApp'])
        ->assertJsonFragment(['pregunta' => 'Pregunta para Ambos'])
        ->assertJsonMissing(['pregunta' => 'Pregunta solo para Web']);
});
