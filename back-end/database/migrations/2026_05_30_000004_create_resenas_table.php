<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resenas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_cliente');
            $table->text('comentario')->nullable();
            $table->unsignedTinyInteger('calificacion');
            $table->timestamp('fecha')->useCurrent();
            $table->enum('estado_aprobacion', ['pendiente', 'aprobado', 'rechazado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resenas');
    }
};
