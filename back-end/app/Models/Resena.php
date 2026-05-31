<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'nombre_cliente',
    'comentario',
    'calificacion',
    'fecha',
    'estado_aprobacion',
])]
class Resena extends Model
{
    protected $table = 'resenas';

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'calificacion' => 'integer',
            'fecha' => 'datetime',
        ];
    }
}
