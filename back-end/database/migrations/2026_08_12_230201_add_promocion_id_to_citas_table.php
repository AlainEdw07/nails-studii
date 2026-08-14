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
        Schema::table('citas', function (Blueprint $table) {
            $table->foreignId('promocion_id')->nullable()->after('servicio_id')->constrained('promociones')->nullOnDelete();
            $table->decimal('precio_final', 10, 2)->nullable()->after('promocion_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            $table->dropForeign(['promocion_id']);
            $table->dropColumn(['promocion_id', 'precio_final']);
        });
    }
};
