<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historial_citas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cita_id')->constrained('citas')->cascadeOnDelete();
            $table->enum('estado', ['pendiente', 'confirmado', 'completado', 'cancelado']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historial_citas');
    }
};
