<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preguntas_chatbot', function (Blueprint $table) {
            $table->id();
            $table->text('pregunta');
            $table->text('opciones_respuesta')->nullable();
            $table->text('accion')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preguntas_chatbot');
    }
};
