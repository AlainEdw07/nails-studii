<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('promociones', 'frecuencia_whatsapp')) {
            Schema::table('promociones', function (Blueprint $table) {
                $table->string('frecuencia_whatsapp')
                    ->default('sin_envio')
                    ->after('aplica_todos_servicios');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('promociones', function (Blueprint $table) {
            $table->dropColumn('frecuencia_whatsapp');
        });
    }
};
