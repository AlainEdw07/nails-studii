<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'nombre',
    'direccion',
    'telefono',
    'correo',
    'redes_sociales',
    'horario_atencion',
])]
class InformacionNegocio extends Model
{
    protected $table = 'informacion_negocio';

    public $timestamps = false;
}
