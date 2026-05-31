<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('galerias', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->string('imagen');
            $table->timestamp('fecha_publicacion')->useCurrent();
            $table->foreignId('servicio_id')->nullable()->constrained('servicios')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('galerias');
    }
};
