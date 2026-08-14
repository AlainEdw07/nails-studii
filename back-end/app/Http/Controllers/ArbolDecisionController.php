<?php

namespace App\Http\Controllers;

use App\Models\Cita;
use App\Models\HorarioDisponible;
use App\Models\Promocion;
use App\Models\Servicio;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ArbolDecisionController extends Controller
{
    /**
     * Obtener el árbol de decisiones para agendamiento
     */
    public function obtenerArbolDecision(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fecha' => ['required', 'date', 'after:today'],
            'servicio_id' => ['nullable', 'exists:servicios,id'],
        ], [
            'fecha.required' => 'La fecha es obligatoria.',
            'fecha.date' => 'La fecha debe tener un formato válido.',
            'fecha.after' => 'La fecha debe ser posterior a hoy.',
            'servicio_id.exists' => 'El servicio seleccionado no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $fecha = Carbon::parse($request->input('fecha'));
        $servicioId = $request->input('servicio_id');

        // Paso 1: Verificar disponibilidad del día
        $disponibilidadDia = $this->verificarDisponibilidadDia($fecha);
        if (! $disponibilidadDia['disponible']) {
            return response()->json([
                'mensaje' => 'No hay disponibilidad para la fecha seleccionada.',
                'razon' => $disponibilidadDia['razon'],
                'paso' => 1,
                'completo' => true,
            ]);
        }

        // Paso 2: Obtener horarios disponibles
        $horariosDisponibles = $this->obtenerHorariosDisponibles($fecha, $servicioId);
        if (empty($horariosDisponibles)) {
            return response()->json([
                'mensaje' => 'No hay horarios disponibles para la fecha seleccionada.',
                'paso' => 2,
                'completo' => true,
            ]);
        }

        // Paso 3: Obtener servicios activos
        $servicios = $this->obtenerServiciosActivos($servicioId);

        // Paso 4: Obtener promociones aplicables
        $promociones = $this->obtenerPromocionesAplicables($fecha, $servicioId);

        // Paso 5: Generar árbol de decisiones completo
        $arbolDecision = $this->generarArbolDecision(
            $fecha,
            $horariosDisponibles,
            $servicios,
            $promociones
        );

        return response()->json([
            'mensaje' => 'Árbol de decisiones generado exitosamente.',
            'paso' => 5,
            'completo' => true,
            'datos' => $arbolDecision,
        ]);
    }

    /**
     * Paso 1: Verificar disponibilidad del día
     */
    private function verificarDisponibilidadDia(Carbon $fecha): array
    {
        $nombreDia = $fecha->locale('es')->dayName;
        $nombreDia = ucfirst($nombreDia);

        $horarioDia = HorarioDisponible::where('dia_semana', $nombreDia)->first();

        if (! $horarioDia) {
            return [
                'disponible' => false,
                'razon' => 'No hay horario configurado para este día.',
            ];
        }

        if (! $horarioDia->activo) {
            return [
                'disponible' => false,
                'razon' => 'El día seleccionado no está disponible.',
            ];
        }

        return ['disponible' => true];
    }

    /**
     * Paso 2: Obtener horarios disponibles
     */
    private function obtenerHorariosDisponibles(Carbon $fecha, ?int $servicioId = null): array
    {
        $nombreDia = $fecha->locale('es')->dayName;
        $nombreDia = ucfirst($nombreDia);

        $horarioDia = HorarioDisponible::where('dia_semana', $nombreDia)
            ->where('activo', true)
            ->first();

        if (! $horarioDia) {
            return [];
        }

        // Obtener citas existentes para esa fecha
        $citasExistentes = Cita::where('fecha_cita', $fecha->toDateString())
            ->whereIn('estado', ['pendiente', 'confirmado'])
            ->get();

        $horasOcupadas = $citasExistentes->pluck('hora_cita')->toArray();

        // Generar horarios disponibles (cada 30 minutos)
        $horarios = [];
        $horaInicio = Carbon::parse($horarioDia->hora_inicio);
        $horaFin = Carbon::parse($horarioDia->hora_fin);

        while ($horaInicio < $horaFin) {
            $hora = $horaInicio->format('H:i');

            if (! in_array($hora, $horasOcupadas)) {
                // Si se seleccionó un servicio, verificar duración
                if ($servicioId) {
                    $servicio = Servicio::find($servicioId);
                    if ($servicio) {
                        $duracion = $servicio->duracion_estimada;
                        $horaFinServicio = $horaInicio->copy()->addMinutes($duracion);

                        if ($horaFinServicio <= $horaFin) {
                            $horarios[] = [
                                'hora' => $hora,
                                'disponible' => true,
                            ];
                        }
                    }
                } else {
                    $horarios[] = [
                        'hora' => $hora,
                        'disponible' => true,
                    ];
                }
            }

            $horaInicio->addMinutes(30);
        }

        return $horarios;
    }

    /**
     * Paso 3: Obtener servicios activos
     */
    private function obtenerServiciosActivos(?int $servicioId = null): array
    {
        $query = Servicio::where('estado', 'activo');

        if ($servicioId) {
            $query->where('id', $servicioId);
        }

        return $query->get()->map(function ($servicio) {
            return [
                'id' => $servicio->id,
                'nombre' => $servicio->nombre,
                'descripcion' => $servicio->descripcion,
                'precio' => $servicio->precio,
                'duracion_estimada' => $servicio->duracion_estimada,
                'imagen_principal' => $servicio->imagen_principal,
            ];
        })->toArray();
    }

    /**
     * Paso 4: Obtener promociones aplicables
     */
    private function obtenerPromocionesAplicables(Carbon $fecha, ?int $servicioId = null): array
    {
        $query = Promocion::where('estado', 'activo')
            ->where('fecha_inicio', '<=', $fecha->toDateString())
            ->where('fecha_fin', '>=', $fecha->toDateString())
            ->where(function ($q) {
                $q->whereNull('usos_maximos')
                    ->orWhereColumn('usos_actuales', '<', 'usos_maximos');
            });

        $promociones = $query->get();

        return $promociones->map(function ($promocion) use ($servicioId) {
            $aplicable = $servicioId
                ? $promocion->aplicaAServicio($servicioId)
                : $promocion->aplica_todos_servicios;

            return [
                'id' => $promocion->id,
                'nombre' => $promocion->nombre,
                'descripcion' => $promocion->descripcion,
                'tipo_descuento' => $promocion->tipo_descuento,
                'valor_descuento' => $promocion->valor_descuento,
                'codigo_promocional' => $promocion->codigo_promocional,
                'condiciones' => $promocion->condiciones,
                'aplicable' => $aplicable,
                'aplica_todos_servicios' => $promocion->aplica_todos_servicios,
            ];
        })->filter(fn ($p) => $p['aplicable'])->values()->toArray();
    }

    /**
     * Paso 5: Generar árbol de decisiones completo
     */
    private function generarArbolDecision(
        Carbon $fecha,
        array $horariosDisponibles,
        array $servicios,
        array $promociones
    ): array {
        return [
            'fecha' => $fecha->toDateString(),
            'dia_semana' => ucfirst($fecha->locale('es')->dayName),
            'disponibilidad' => [
                'total_horarios' => count($horariosDisponibles),
                'horarios' => $horariosDisponibles,
            ],
            'servicios' => $servicios,
            'promociones' => $promociones,
            'resumen' => [
                'total_servicios' => count($servicios),
                'total_promociones' => count($promociones),
                'total_horarios_disponibles' => count($horariosDisponibles),
            ],
        ];
    }

    /**
     * Calcular precio final con promoción
     */
    public function calcularPrecio(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'servicio_id' => ['required', 'exists:servicios,id'],
            'promocion_id' => ['nullable', 'exists:promociones,id'],
        ], [
            'servicio_id.required' => 'El servicio es obligatorio.',
            'servicio_id.exists' => 'El servicio no existe.',
            'promocion_id.exists' => 'La promoción no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $servicio = Servicio::find($request->input('servicio_id'));
        $promocion = $request->input('promocion_id')
            ? Promocion::find($request->input('promocion_id'))
            : null;

        $precioOriginal = $servicio->precio;
        $descuento = 0;
        $precioFinal = $precioOriginal;

        if ($promocion && $promocion->estaActiva() && $promocion->aplicaAServicio($servicio->id)) {
            $descuento = $promocion->calcularDescuento($precioOriginal);
            $precioFinal = $precioOriginal - $descuento;
        }

        return response()->json([
            'mensaje' => 'Precio calculado exitosamente.',
            'datos' => [
                'servicio' => [
                    'id' => $servicio->id,
                    'nombre' => $servicio->nombre,
                    'precio_original' => $precioOriginal,
                ],
                'promocion' => $promocion ? [
                    'id' => $promocion->id,
                    'nombre' => $promocion->nombre,
                    'tipo_descuento' => $promocion->tipo_descuento,
                    'valor_descuento' => $promocion->valor_descuento,
                ] : null,
                'descuento_aplicado' => $descuento,
                'precio_final' => max(0, $precioFinal),
            ],
        ]);
    }
}
