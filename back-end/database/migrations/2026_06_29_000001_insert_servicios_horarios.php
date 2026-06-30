<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Insert sample services
        DB::table('servicios')->insert([
            [
                'nombre' => 'Manicura básica',
                'descripcion' => 'Manicura con limado, cutículas y esmaltado simple.',
                'precio' => 20000.00,
                'duracion_estimada' => 45,
                'imagen_principal' => null,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Manicura + esmaltado en gel',
                'descripcion' => 'Manicura completa con aplicación de esmalte en gel durable.',
                'precio' => 40000.00,
                'duracion_estimada' => 75,
                'imagen_principal' => null,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Pedicura spa',
                'descripcion' => 'Pedicura con baño de pies, exfoliación y esmaltado.',
                'precio' => 35000.00,
                'duracion_estimada' => 60,
                'imagen_principal' => null,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre' => 'Extensión de uñas acrílicas',
                'descripcion' => 'Aplicación de uñas acrílicas con diseño básico.',
                'precio' => 80000.00,
                'duracion_estimada' => 120,
                'imagen_principal' => null,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Insert sample horarios disponibles (varios días y franjas)
        DB::table('horarios_disponibles')->insert([
            ['dia_semana' => 'Lunes', 'hora_inicio' => '09:00:00', 'hora_fin' => '13:00:00', 'activo' => true],
            ['dia_semana' => 'Lunes', 'hora_inicio' => '14:00:00', 'hora_fin' => '18:00:00', 'activo' => true],
            ['dia_semana' => 'Martes', 'hora_inicio' => '09:00:00', 'hora_fin' => '13:00:00', 'activo' => true],
            ['dia_semana' => 'Martes', 'hora_inicio' => '14:00:00', 'hora_fin' => '18:00:00', 'activo' => true],
            ['dia_semana' => 'Miércoles', 'hora_inicio' => '09:00:00', 'hora_fin' => '13:00:00', 'activo' => true],
            ['dia_semana' => 'Miércoles', 'hora_inicio' => '14:00:00', 'hora_fin' => '18:00:00', 'activo' => true],
            ['dia_semana' => 'Jueves', 'hora_inicio' => '09:00:00', 'hora_fin' => '13:00:00', 'activo' => true],
            ['dia_semana' => 'Jueves', 'hora_inicio' => '14:00:00', 'hora_fin' => '18:00:00', 'activo' => true],
            ['dia_semana' => 'Viernes', 'hora_inicio' => '09:00:00', 'hora_fin' => '13:00:00', 'activo' => true],
            ['dia_semana' => 'Viernes', 'hora_inicio' => '14:00:00', 'hora_fin' => '18:00:00', 'activo' => true],
            ['dia_semana' => 'Sábado', 'hora_inicio' => '09:00:00', 'hora_fin' => '13:00:00', 'activo' => true],
        ]);
    }

    public function down(): void
    {
        DB::table('servicios')->whereIn('nombre', [
            'Manicura básica',
            'Manicura + esmaltado en gel',
            'Pedicura spa',
            'Extensión de uñas acrílicas',
        ])->delete();

        DB::table('horarios_disponibles')->whereIn('dia_semana', ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'])->delete();
    }
};
