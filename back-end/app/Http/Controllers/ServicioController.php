<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ServicioController extends Controller
{
    public function index(): JsonResponse
    {
        $query = Servicio::query()->orderBy('nombre');

        if (! auth('admin')->check()) {
            $query->where('estado', 'activo');
        }

        $servicios = $query->get([
            'id',
            'nombre',
            'descripcion',
            'precio',
            'duracion_estimada',
            'imagen_principal',
            'estado',
        ]);

        return response()->json([
            'servicios' => $servicios,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'precio' => ['required', 'numeric', 'min:0'],
            'duracion_estimada' => ['required', 'integer', 'min:1'],
            'imagen_principal' => ['nullable', 'string', 'max:255'],
            'estado' => ['sometimes', 'string', 'in:activo,inactivo'],
        ], [
            'nombre.required' => 'El nombre del servicio es obligatorio.',
            'precio.required' => 'El precio es obligatorio.',
            'precio.min' => 'El precio no puede ser negativo.',
            'duracion_estimada.required' => 'La duración estimada es obligatoria.',
            'duracion_estimada.min' => 'La duración estimada debe ser al menos 1 minuto.',
            'estado.in' => 'El estado del servicio no es válido.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos del servicio inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $servicio = Servicio::create([
            ...$validator->validated(),
            'estado' => $request->input('estado', 'activo'),
        ]);

        return response()->json([
            'mensaje' => 'Servicio creado correctamente.',
            'servicio' => $servicio,
        ], 201);
    }

    public function show(Servicio $servicio): JsonResponse
    {
        return response()->json([
            'servicio' => $servicio,
        ]);
    }

    public function update(Request $request, Servicio $servicio): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => ['sometimes', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'precio' => ['sometimes', 'numeric', 'min:0'],
            'duracion_estimada' => ['sometimes', 'integer', 'min:1'],
            'imagen_principal' => ['nullable', 'string', 'max:255'],
            'estado' => ['sometimes', 'string', 'in:activo,inactivo'],
        ], [
            'precio.min' => 'El precio no puede ser negativo.',
            'duracion_estimada.min' => 'La duración estimada debe ser al menos 1 minuto.',
            'estado.in' => 'El estado del servicio no es válido.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos del servicio inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $servicio->update($validator->validated());

        return response()->json([
            'mensaje' => 'Servicio actualizado correctamente.',
            'servicio' => $servicio->fresh(),
        ]);
    }

    public function destroy(Servicio $servicio): JsonResponse
    {
        $servicio->delete();

        return response()->json([
            'mensaje' => 'Servicio eliminado correctamente.',
        ]);
    }
}
