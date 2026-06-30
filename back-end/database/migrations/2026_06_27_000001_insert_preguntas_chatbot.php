<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('preguntas_chatbot')->insert([
            [
                'pregunta' => '¿En qué puedo ayudarte hoy?',
                'opciones_respuesta' => json_encode([
                    'Ver servicios',
                    'Ver horarios disponibles',
                    'Agendar una cita',
                    'Hablar con un asesor',
                ], JSON_UNESCAPED_UNICODE),
                'accion' => 'menu_principal',
            ],
            [
                'pregunta' => 'Aquí están nuestros servicios. ¿Qué servicio te interesa?',
                'opciones_respuesta' => null,
                'accion' => 'listar_servicios',
            ],
            [
                'pregunta' => 'Nuestros horarios disponibles son los siguientes. ¿Qué día prefieres?',
                'opciones_respuesta' => null,
                'accion' => 'mostrar_horarios',
            ],
            [
                'pregunta' => 'Para agendar la cita, por favor dime el servicio que quieres reservar.',
                'opciones_respuesta' => null,
                'accion' => 'pedir_servicio',
            ],
            [
                'pregunta' => 'Selecciona la fecha para tu cita.',
                'opciones_respuesta' => null,
                'accion' => 'pedir_fecha',
            ],
            [
                'pregunta' => 'Selecciona la hora que te convenga.',
                'opciones_respuesta' => null,
                'accion' => 'pedir_hora',
            ],
            [
                'pregunta' => '¿Cuál es tu nombre completo para confirmar la reserva?',
                'opciones_respuesta' => null,
                'accion' => 'pedir_nombre',
            ],
            [
                'pregunta' => '¿Cuál es tu teléfono de contacto?',
                'opciones_respuesta' => null,
                'accion' => 'pedir_telefono',
            ],
            [
                'pregunta' => '¿Deseas agregar alguna nota adicional para tu cita?',
                'opciones_respuesta' => json_encode([
                    'No',
                    'Sí, añadir nota',
                ], JSON_UNESCAPED_UNICODE),
                'accion' => 'pedir_notas',
            ],
            [
                'pregunta' => 'Tu cita ha sido agendada correctamente. ¿Quieres ver el resumen o volver al menú principal?',
                'opciones_respuesta' => json_encode([
                    'Ver resumen',
                    'Volver al menú',
                ], JSON_UNESCAPED_UNICODE),
                'accion' => 'confirmacion_cita',
            ],
        ]);
    }

    public function down(): void
    {
        DB::table('preguntas_chatbot')->whereIn('pregunta', [
            '¿En qué puedo ayudarte hoy?',
            'Aquí están nuestros servicios. ¿Qué servicio te interesa?',
            'Nuestros horarios disponibles son los siguientes. ¿Qué día prefieres?',
            'Para agendar la cita, por favor dime el servicio que quieres reservar.',
            'Selecciona la fecha para tu cita.',
            'Selecciona la hora que te convenga.',
            '¿Cuál es tu nombre completo para confirmar la reserva?',
            '¿Cuál es tu teléfono de contacto?',
            '¿Deseas agregar alguna nota adicional para tu cita?',
            'Tu cita ha sido agendada correctamente. ¿Quieres ver el resumen o volver al menú principal?',
        ])->delete();
    }
};
