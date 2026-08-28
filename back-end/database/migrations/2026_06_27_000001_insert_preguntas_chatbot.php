<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('preguntas_chatbot')->delete();

        DB::table('preguntas_chatbot')->insert([
            [
                'pregunta' => '¿En qué puedo ayudarte hoy?',
                'opciones_respuesta' => json_encode([
                    'Catálogo de servicios',
                    'Precios aproximados',
                    'Horarios disponibles',
                    'Consulta de disponibilidad general',
                    'Derivar atención a WhatsApp',
                ], JSON_UNESCAPED_UNICODE),
                'accion' => 'menu_principal',
            ],
            [
                'pregunta' => 'Aquí está nuestro catálogo de servicios. ¿Sobre cuál deseas información?',
                'opciones_respuesta' => null,
                'accion' => 'listar_servicios',
            ],
            [
                'pregunta' => 'Aquí puedes consultar nuestros precios aproximados para cada servicio.',
                'opciones_respuesta' => null,
                'accion' => 'mostrar_precios',
            ],
            [
                'pregunta' => 'Nuestros horarios habituales de atención son los siguientes:',
                'opciones_respuesta' => null,
                'accion' => 'mostrar_horarios',
            ],
            [
                'pregunta' => 'Mantenemos atención general en nuestros horarios establecidos. Si requieres confirmar un horario específico, podemos derivarte a WhatsApp.',
                'opciones_respuesta' => json_encode([
                    'Derivar atención a WhatsApp',
                    'Volver al menú principal',
                ], JSON_UNESCAPED_UNICODE),
                'accion' => 'consultar_disponibilidad',
            ],
            [
                'pregunta' => 'Si tu duda no fue resuelta con el menú automático, puedes derivar tu atención directamente a WhatsApp.',
                'opciones_respuesta' => json_encode([
                    'Volver al menú principal',
                ], JSON_UNESCAPED_UNICODE),
                'accion' => 'derivar_whatsapp',
            ],
        ]);
    }

    public function down(): void
    {
        DB::table('preguntas_chatbot')->whereIn('accion', [
            'menu_principal',
            'listar_servicios',
            'mostrar_precios',
            'mostrar_horarios',
            'consultar_disponibilidad',
            'derivar_whatsapp',
        ])->delete();
    }
};
