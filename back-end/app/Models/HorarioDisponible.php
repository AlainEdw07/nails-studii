<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'dia_semana',
    'hora_inicio',
    'hora_fin',
    'activo',
])]
class HorarioDisponible extends Model
{
    protected $table = 'horarios_disponibles';

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }
}
