<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;

#[Fillable(['nombre_usuario', 'contrasena', 'correo'])]
#[Hidden(['contrasena'])]
class Administrador extends Authenticatable
{
    protected $table = 'administradores';

    protected function casts(): array
    {
        return [
            'contrasena' => 'hashed',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->contrasena;
    }
}
