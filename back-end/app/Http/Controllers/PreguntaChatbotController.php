<?php

namespace App\Http\Controllers;

use App\Models\HorarioDisponible;
use App\Models\PreguntaChatbot;
use App\Models\Servicio;
use Illuminate\Http\JsonResponse;

use Illuminate\Http\Request;

class PreguntaChatbotController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tipo = $request->query('tipo');

        $query = PreguntaChatbot::query();

        if ($tipo && is_string($tipo)) {
            $query->where(function ($q) use ($tipo) {
                $q->where('tipo', $tipo)
                  ->orWhere('tipo', 'ambos');
            });
        }

        $preguntas = $query
            ->orderBy('id')
            ->get(['id', 'tipo', 'pregunta', 'opciones_respuesta', 'accion'])
            ->map(function (PreguntaChatbot $pregunta) {
                if (!is_string($pregunta->opciones_respuesta) || $pregunta->opciones_respuesta === '') {
                    return $pregunta;
                }

                $decoded = json_decode($pregunta->opciones_respuesta, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $pregunta->opciones_respuesta = $decoded;
                    return $pregunta;
                }

                $clean = trim($pregunta->opciones_respuesta);
                if (str_starts_with($clean, '[') && str_ends_with($clean, ']')) {
                    $normalized = str_replace("'", '"', $clean);
                    $decoded = json_decode($normalized, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $pregunta->opciones_respuesta = $decoded;
                    }
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
