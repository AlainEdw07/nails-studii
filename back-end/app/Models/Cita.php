<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'nombre_cliente',
    'telefono',
    'correo',
    'servicio_id',
    'promocion_id',
    'fecha_cita',
    'hora_cita',
    'notas_adicionales',
    'estado',
    'precio_final',
])]
class Cita extends Model
{
    protected $table = 'citas';

    protected function casts(): array
    {
        return [
            'fecha_cita' => 'date',
        ];
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function promocion(): BelongsTo
    {
        return $this->belongsTo(Promocion::class, 'promocion_id');
    }

    public function historial(): HasMany
    {
        return $this->hasMany(HistorialCita::class, 'cita_id');
    }
}
