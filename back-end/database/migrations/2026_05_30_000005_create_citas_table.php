<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('citas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_cliente');
            $table->string('telefono', 20)->nullable();
            $table->string('correo')->nullable();
            $table->foreignId('servicio_id')->nullable()->constrained('servicios')->nullOnDelete();
            $table->date('fecha_cita');
            $table->time('hora_cita');
            $table->text('notas_adicionales')->nullable();
            $table->enum('estado', ['pendiente', 'confirmado', 'completado', 'cancelado']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('citas');
    }
};
