<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('informacion_negocio', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('direccion')->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('correo')->nullable();
            $table->text('redes_sociales')->nullable();
            $table->text('horario_atencion')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('informacion_negocio');
    }
};
