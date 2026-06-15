<?php

namespace Database\Seeders;

use App\Models\HorarioDisponible;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class HorariosDisponiblesSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        HorarioDisponible::query()->truncate();

        $horarios = [
            ['dia_semana' => 'Lunes', 'hora_inicio' => '09:00:00', 'hora_fin' => '17:00:00', 'activo' => true],
            ['dia_semana' => 'Martes', 'hora_inicio' => '09:00:00', 'hora_fin' => '17:00:00', 'activo' => true],
            ['dia_semana' => 'Miércoles', 'hora_inicio' => '09:00:00', 'hora_fin' => '17:00:00', 'activo' => true],
            ['dia_semana' => 'Jueves', 'hora_inicio' => '09:00:00', 'hora_fin' => '17:00:00', 'activo' => true],
            ['dia_semana' => 'Viernes', 'hora_inicio' => '09:00:00', 'hora_fin' => '17:00:00', 'activo' => true],
            ['dia_semana' => 'Sábado', 'hora_inicio' => '10:00:00', 'hora_fin' => '15:00:00', 'activo' => true],
            ['dia_semana' => 'Domingo', 'hora_inicio' => '10:00:00', 'hora_fin' => '14:00:00', 'activo' => false],
        ];

        foreach ($horarios as $horario) {
            HorarioDisponible::create($horario);
        }
    }
}
