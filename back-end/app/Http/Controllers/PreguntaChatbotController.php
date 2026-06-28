<?php

namespace App\Http\Controllers;

use App\Models\HorarioDisponible;
use App\Models\PreguntaChatbot;
use App\Models\Servicio;
use Illuminate\Http\JsonResponse;

class PreguntaChatbotController extends Controller
{
    public function index(): JsonResponse
    {
        $preguntas = PreguntaChatbot::query()
            ->orderBy('id')
            ->get(['id', 'pregunta', 'opciones_respuesta', 'accion'])
            ->map(function (PreguntaChatbot $pregunta) {
                if (is_string($pregunta->opciones_respuesta) && $pregunta->opciones_respuesta !== '') {
                    $pregunta->opciones_respuesta = json_decode($pregunta->opciones_respuesta, true);
                }

                return $pregunta;
            });

        $servicios = Servicio::query()
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
                'descripcion',
                'precio',
                'duracion_estimada',
                'imagen_principal',
                'estado',
            ]);

        $horariosDisponibles = HorarioDisponible::query()
            ->where('activo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json([
            'preguntas' => $preguntas,
            'servicios' => $servicios,
            'horarios_disponibles' => $horariosDisponibles,
        ]);
    }
}
