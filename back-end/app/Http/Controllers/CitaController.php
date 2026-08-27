<?php

namespace App\Http\Controllers;

use App\Models\Cita;
use App\Models\HistorialCita;
use App\Models\Promocion;
use App\Models\Servicio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CitaController extends Controller
{
    public function index(): JsonResponse
    {
        $citas = Cita::query()
            ->with('servicio:id,nombre,precio,duracion_estimada', 'promocion:id,nombre,tipo_descuento,valor_descuento')
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
            'promocion_id' => ['nullable', 'integer', 'exists:promociones,id'],
            'fecha_cita' => ['required', 'date', 'after_or_equal:today'],
            'hora_cita' => ['required', 'date_format:H:i'],
            'notas_adicionales' => ['nullable', 'string'],
        ], [
            'nombre_cliente.required' => 'El nombre del cliente es obligatorio.',
            'correo.email' => 'El correo no tiene un formato válido.',
            'servicio_id.exists' => 'El servicio seleccionado no existe.',
            'promocion_id.exists' => 'La promoción seleccionada no existe.',
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

        $validated = $validator->validated();

        // Calcular precio final con promoción
        $precioFinal = null;
        $servicioId = $validated['servicio_id'] ?? null;
        $promocionId = $validated['promocion_id'] ?? null;

        if ($servicioId) {
            $servicio = Servicio::find($servicioId);
            if ($servicio) {
                $precioFinal = $servicio->precio;

                if ($promocionId) {
                    $promocion = Promocion::find($promocionId);
                    if ($promocion && $promocion->estaActiva() && $promocion->aplicaAServicio($servicio->id)) {
                        $descuento = $promocion->calcularDescuento($servicio->precio);
                        $precioFinal = max(0, $servicio->precio - $descuento);

                        // Incrementar usos de la promoción
                        $promocion->increment('usos_actuales');
                    }
                }
            }
        }

        $cita = Cita::create([
            ...$validated,
            'precio_final' => $precioFinal,
            'estado' => 'pendiente',
        ]);

        HistorialCita::create([
            'cita_id' => $cita->id,
            'estado' => 'pendiente',
        ]);

        $cita->load('servicio:id,nombre,precio,duracion_estimada', 'promocion:id,nombre,tipo_descuento,valor_descuento');

        return response()->json([
            'mensaje' => 'Cita creada correctamente.',
            'cita' => $cita,
        ], 201);
    }
}
