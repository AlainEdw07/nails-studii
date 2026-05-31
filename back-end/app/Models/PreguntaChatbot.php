<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'pregunta',
    'opciones_respuesta',
    'accion',
])]
class PreguntaChatbot extends Model
{
    protected $table = 'preguntas_chatbot';

    public $timestamps = false;
}
