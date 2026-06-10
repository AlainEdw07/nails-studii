<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('administradores')->updateOrInsert(
            ['correo' => 'admin@nailsstudio.com'],
            [
                'nombre_usuario' => 'admin',
                'contrasena' => Hash::make('NailsAdmin!2026#Strong'),
                'correo' => 'admin@nailsstudio.com',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('administradores')->where('correo', 'admin@nailsstudio.com')->delete();
    }
};
