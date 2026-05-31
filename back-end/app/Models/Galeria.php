<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'titulo',
    'descripcion',
    'imagen',
    'fecha_publicacion',
    'servicio_id',
])]
class Galeria extends Model
{
    protected $table = 'galerias';

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'fecha_publicacion' => 'datetime',
        ];
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }
}
