<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('preguntas_chatbot', 'tipo')) {
            Schema::table('preguntas_chatbot', function (Blueprint $table) {
                $table->string('tipo', 20)->default('ambos')->after('id');
            });
        }

        // Limpiar preguntas anteriores para sembrar las preguntas separadas
        DB::table('preguntas_chatbot')->delete();

        // Preguntas para Chatbot Web
        DB::table('preguntas_chatbot')->insert([
            [
                'tipo' => 'web',
                'pregunta' => '¡Hola! Bienvenida a Nails Studii Web. ¿En qué podemos ayudarte hoy?',
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
                'tipo' => 'web',
                'pregunta' => 'Aquí está nuestro catálogo de servicios. ¿Sobre cuál deseas información?',
                'opciones_respuesta' => null,
                'accion' => 'listar_servicios',
            ],
            [
                'tipo' => 'web',
                'pregunta' => 'Aquí puedes consultar nuestros precios aproximados para cada servicio.',
                'opciones_respuesta' => null,
                'accion' => 'mostrar_precios',
            ],
            [
                'tipo' => 'web',
                'pregunta' => 'Nuestros horarios habituales de atención son los siguientes:',
                'opciones_respuesta' => null,
                'accion' => 'mostrar_horarios',
            ],
            [
                'tipo' => 'web',
                'pregunta' => 'Mantenemos atención general en nuestros horarios establecidos. Si requieres confirmar un horario específico, podemos derivarte a WhatsApp.',
                'opciones_respuesta' => json_encode([
                    'Derivar atención a WhatsApp',
                    'Volver al menú principal',
                ], JSON_UNESCAPED_UNICODE),
                'accion' => 'consultar_disponibilidad',
            ],
            [
                'tipo' => 'web',
                'pregunta' => 'Si tu duda no fue resuelta con el menú automático, puedes derivar tu atención directamente a WhatsApp.',
                'opciones_respuesta' => json_encode([
                    'Volver al menú principal',
                ], JSON_UNESCAPED_UNICODE),
                'accion' => 'derivar_whatsapp',
            ],

            // Preguntas para Chatbot WhatsApp
            [
                'tipo' => 'whatsapp',
                'pregunta' => '¡Hola! 🌸 Te saludamos de Nails Studii para dar seguimiento a tu solicitud de información, cotizaciones o citas. ¿En qué te podemos ayudar hoy?',
                'opciones_respuesta' => json_encode([
                    'Solicitud de información de servicios',
                    'Cotizaciones de servicios',
                    'Agendar cita',
                ], JSON_UNESCAPED_UNICODE),
                'accion' => 'menu_principal',
            ],
            [
                'tipo' => 'whatsapp',
                'pregunta' => 'Te compartimos la información detallada de nuestros servicios disponibles:',
                'opciones_respuesta' => null,
                'accion' => 'informacion_servicios',
            ],
            [
                'tipo' => 'whatsapp',
                'pregunta' => 'Te presentamos la lista de cotizaciones y precios aproximados de nuestros servicios:',
                'opciones_respuesta' => null,
                'accion' => 'cotizaciones_servicios',
            ],
            [
                'tipo' => 'whatsapp',
                'pregunta' => 'Para agendar o consultar disponibilidad de citas, estos son nuestros horarios de atención:',
                'opciones_respuesta' => null,
                'accion' => 'agendar_citas',
            ],
        ]);
    }

    public function down(): void
    {
        Schema::table('preguntas_chatbot', function (Blueprint $table) {
            $table->dropColumn('tipo');
        });
    }
};
