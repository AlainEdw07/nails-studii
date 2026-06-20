<?php

namespace App\Http\Controllers;

use App\Models\Cita;
use App\Models\HistorialCita;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CitaController extends Controller
{
    public function index(): JsonResponse
    {
        $citas = Cita::query()
            ->with('servicio:id,nombre,precio,duracion_estimada')
            ->orderByDesc('fecha_cita')
            ->orderByDesc('hora_cita')
            ->get();

        return response()->json([
            'citas' => $citas,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre_cliente' => ['required', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'correo' => ['nullable', 'email', 'max:255'],
            'servicio_id' => ['nullable', 'integer', 'exists:servicios,id'],
            'fecha_cita' => ['required', 'date', 'after_or_equal:today'],
            'hora_cita' => ['required', 'date_format:H:i'],
            'notas_adicionales' => ['nullable', 'string'],
        ], [
            'nombre_cliente.required' => 'El nombre del cliente es obligatorio.',
            'correo.email' => 'El correo no tiene un formato válido.',
            'servicio_id.exists' => 'El servicio seleccionado no existe.',
            'fecha_cita.required' => 'La fecha de la cita es obligatoria.',
            'fecha_cita.after_or_equal' => 'La fecha de la cita no puede ser anterior a hoy.',
            'hora_cita.required' => 'La hora de la cita es obligatoria.',
            'hora_cita.date_format' => 'La hora debe tener el formato HH:MM.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de la cita inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $cita = Cita::create([
            ...$validator->validated(),
            'estado' => 'pendiente',
        ]);

        HistorialCita::create([
            'cita_id' => $cita->id,
            'estado' => 'pendiente',
        ]);

        $cita->load('servicio:id,nombre,precio,duracion_estimada');

        return response()->json([
            'mensaje' => 'Cita creada correctamente.',
            'cita' => $cita,
        ], 201);
    }
}
