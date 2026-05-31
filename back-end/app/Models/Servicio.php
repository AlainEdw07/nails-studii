<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'nombre',
    'descripcion',
    'precio',
    'duracion_estimada',
    'imagen_principal',
    'estado',
])]
class Servicio extends Model
{
    protected $table = 'servicios';

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'duracion_estimada' => 'integer',
        ];
    }

    public function galerias(): HasMany
    {
        return $this->hasMany(Galeria::class, 'servicio_id');
    }

    public function citas(): HasMany
    {
        return $this->hasMany(Cita::class, 'servicio_id');
    }
}
