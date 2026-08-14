<?php

namespace App\Http\Controllers;

use App\Models\Promocion;
use App\Models\Servicio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PromocionController extends Controller
{
    public function index(): JsonResponse
    {
        $promociones = Promocion::with('servicios:id,nombre,precio')->get();

        return response()->json([
            'promociones' => $promociones,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'tipo_descuento' => ['required', 'in:porcentaje,monto_fijo,2x1,servicio_gratis'],
            'valor_descuento' => ['nullable', 'numeric', 'min:0'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after:fecha_inicio'],
            'condiciones' => ['nullable', 'string'],
            'codigo_promocional' => ['nullable', 'string', 'unique:promociones,codigo_promocional'],
            'usos_maximos' => ['nullable', 'integer', 'min:1'],
            'aplica_todos_servicios' => ['boolean'],
            'servicio_ids' => ['nullable', 'array'],
            'servicio_ids.*' => ['exists:servicios,id'],
        ], [
            'nombre.required' => 'El nombre de la promoción es obligatorio.',
            'tipo_descuento.required' => 'El tipo de descuento es obligatorio.',
            'tipo_descuento.in' => 'El tipo de descuento debe ser: porcentaje, monto_fijo, 2x1 o servicio_gratis.',
            'fecha_inicio.required' => 'La fecha de inicio es obligatoria.',
            'fecha_fin.required' => 'La fecha de fin es obligatoria.',
            'fecha_fin.after' => 'La fecha de fin debe ser posterior a la fecha de inicio.',
            'codigo_promocional.unique' => 'El código promocional ya está en uso.',
            'servicio_ids.*.exists' => 'Uno de los servicios seleccionados no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de la promoción inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $promocion = Promocion::create([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'tipo_descuento' => $validated['tipo_descuento'],
            'valor_descuento' => $validated['valor_descuento'] ?? null,
            'fecha_inicio' => $validated['fecha_inicio'],
            'fecha_fin' => $validated['fecha_fin'],
            'condiciones' => $validated['condiciones'] ?? null,
            'codigo_promocional' => $validated['codigo_promocional'] ?? null,
            'usos_maximos' => $validated['usos_maximos'] ?? null,
            'aplica_todos_servicios' => $validated['aplica_todos_servicios'] ?? false,
            'estado' => 'activo',
        ]);

        // Asociar servicios si no aplica a todos
        if (! $promocion->aplica_todos_servicios && isset($validated['servicio_ids'])) {
            $promocion->servicios()->attach($validated['servicio_ids']);
        }

        $promocion->load('servicios:id,nombre,precio');

        return response()->json([
            'mensaje' => 'Promoción creada correctamente.',
            'promocion' => $promocion,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $promocion = Promocion::with('servicios:id,nombre,precio')->find($id);

        if (! $promocion) {
            return response()->json([
                'mensaje' => 'Promoción no encontrada.',
            ], 404);
        }

        return response()->json([
            'promocion' => $promocion,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $promocion = Promocion::find($id);

        if (! $promocion) {
            return response()->json([
                'mensaje' => 'Promoción no encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => ['string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'tipo_descuento' => ['in:porcentaje,monto_fijo,2x1,servicio_gratis'],
            'valor_descuento' => ['nullable', 'numeric', 'min:0'],
            'fecha_inicio' => ['date'],
            'fecha_fin' => ['date', 'after:fecha_inicio'],
            'condiciones' => ['nullable', 'string'],
            'codigo_promocional' => ['nullable', 'string', 'unique:promociones,codigo_promocional,'.$id],
            'usos_maximos' => ['nullable', 'integer', 'min:1'],
            'estado' => ['in:activo,inactivo,agotado'],
            'aplica_todos_servicios' => ['boolean'],
            'servicio_ids' => ['nullable', 'array'],
            'servicio_ids.*' => ['exists:servicios,id'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de la promoción inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $promocion->update($validated);

        // Actualizar servicios si se proporcionan
        if (isset($validated['servicio_ids'])) {
            if ($promocion->aplica_todos_servicios) {
                $promocion->servicios()->detach();
            } else {
                $promocion->servicios()->sync($validated['servicio_ids']);
            }
        }

        $promocion->load('servicios:id,nombre,precio');

        return response()->json([
            'mensaje' => 'Promoción actualizada correctamente.',
            'promocion' => $promocion,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $promocion = Promocion::find($id);

        if (! $promocion) {
            return response()->json([
                'mensaje' => 'Promoción no encontrada.',
            ], 404);
        }

        $promocion->delete();

        return response()->json([
            'mensaje' => 'Promoción eliminada correctamente.',
        ]);
    }

    public function activas(): JsonResponse
    {
        $hoy = now()->toDateString();
        $promociones = Promocion::where('estado', 'activo')
            ->where('fecha_inicio', '<=', $hoy)
            ->where('fecha_fin', '>=', $hoy)
            ->where(function ($q) {
                $q->whereNull('usos_maximos')
                    ->orWhereColumn('usos_actuales', '<', 'usos_maximos');
            })
            ->with('servicios:id,nombre,precio')
            ->get();

        return response()->json([
            'promociones' => $promociones,
        ]);
    }
}
