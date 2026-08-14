<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'nombre',
    'descripcion',
    'tipo_descuento',
    'valor_descuento',
    'fecha_inicio',
    'fecha_fin',
    'condiciones',
    'codigo_promocional',
    'usos_maximos',
    'usos_actuales',
    'estado',
    'aplica_todos_servicios',
])]
class Promocion extends Model
{
    protected $table = 'promociones';

    protected function casts(): array
    {
        return [
            'valor_descuento' => 'decimal:2',
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
            'aplica_todos_servicios' => 'boolean',
        ];
    }

    public function servicios(): BelongsToMany
    {
        return $this->belongsToMany(Servicio::class, 'promocion_servicio');
    }

    public function citas(): HasMany
    {
        return $this->hasMany(Cita::class, 'promocion_id');
    }

    public function estaActiva(): bool
    {
        $hoy = now()->toDateString();
        return $this->estado === 'activo'
            && $this->fecha_inicio <= $hoy
            && $this->fecha_fin >= $hoy
            && ($this->usos_maximos === null || $this->usos_actuales < $this->usos_maximos);
    }

    public function aplicaAServicio(int $servicioId): bool
    {
        if ($this->aplica_todos_servicios) {
            return true;
        }

        return $this->servicios()->where('servicio_id', $servicioId)->exists();
    }

    public function calcularDescuento(float $precioOriginal): float
    {
        return match ($this->tipo_descuento) {
            'porcentaje' => $precioOriginal * ($this->valor_descuento / 100),
            'monto_fijo' => min($this->valor_descuento, $precioOriginal),
            '2x1' => $precioOriginal, // Segundo servicio gratis
            'servicio_gratis' => $precioOriginal, // Servicio completo gratis
            default => 0,
        };
    }
}
