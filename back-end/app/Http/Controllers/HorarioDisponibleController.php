<?php

namespace App\Http\Controllers;

use App\Models\HorarioDisponible;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HorarioDisponibleController extends Controller
{
    public function index(): JsonResponse
    {
        $horarios = HorarioDisponible::query()
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json([
            'horarios_disponibles' => $horarios,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'dia_semana' => ['required', 'string', 'in:Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fin' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'activo' => ['sometimes', 'boolean'],
        ], [
            'dia_semana.required' => 'El día de la semana es obligatorio.',
            'dia_semana.in' => 'El día de la semana seleccionado no es válido.',
            'hora_inicio.required' => 'La hora de inicio es obligatoria.',
            'hora_inicio.date_format' => 'La hora de inicio debe tener el formato HH:MM.',
            'hora_fin.required' => 'La hora de fin es obligatoria.',
            'hora_fin.date_format' => 'La hora de fin debe tener el formato HH:MM.',
            'hora_fin.after' => 'La hora de fin debe ser posterior a la hora de inicio.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos inválidos para crear horario disponible.',
                'errores' => $validator->errors(),
            ], 422);
        }

        if (HorarioDisponible::query()->where('dia_semana', $request->input('dia_semana'))->exists()) {
            return response()->json([
                'mensaje' => 'Ya existe un horario para este día. Utiliza la actualización para cambiar las horas o el estado.',
            ], 422);
        }

        $horario = HorarioDisponible::create([
            ...$validator->validated(),
            'activo' => $request->boolean('activo', true),
        ]);

        return response()->json([
            'mensaje' => 'Horario disponible creado correctamente.',
            'horario_disponible' => $horario,
        ], 201);
    }

    public function update(Request $request, HorarioDisponible $horario): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fin' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'activo' => ['sometimes', 'boolean'],
        ], [
            'hora_inicio.required' => 'La hora de inicio es obligatoria.',
            'hora_inicio.date_format' => 'La hora de inicio debe tener el formato HH:MM.',
            'hora_fin.required' => 'La hora de fin es obligatoria.',
            'hora_fin.date_format' => 'La hora de fin debe tener el formato HH:MM.',
            'hora_fin.after' => 'La hora de fin debe ser posterior a la hora de inicio.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos inválidos para actualizar horario disponible.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $horario->update([
            ...$validator->validated(),
            'activo' => $request->boolean('activo', $horario->activo),
        ]);

        return response()->json([
            'mensaje' => 'Horario disponible actualizado correctamente.',
            'horario_disponible' => $horario,
        ]);
    }
}
