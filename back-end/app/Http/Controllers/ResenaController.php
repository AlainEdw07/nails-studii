<?php

namespace App\Http\Controllers;

use App\Models\Resena;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ResenaController extends Controller
{
    public function index(): JsonResponse
    {
        $resenas = Resena::query()
            ->where('estado_aprobacion', 'aprobado')
            ->orderByDesc('fecha')
            ->get([
                'id',
                'nombre_cliente',
                'comentario',
                'calificacion',
                'fecha',
            ]);

        return response()->json([
            'resenas' => $resenas,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre_cliente' => ['required', 'string', 'max:255'],
            'comentario' => ['nullable', 'string'],
            'calificacion' => ['required', 'integer', 'min:1', 'max:5'],
        ], [
            'nombre_cliente.required' => 'El nombre del cliente es obligatorio.',
            'calificacion.required' => 'La calificación es obligatoria.',
            'calificacion.min' => 'La calificación mínima es 1.',
            'calificacion.max' => 'La calificación máxima es 5.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de la reseña inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $resena = Resena::create([
            ...$validator->validated(),
            'estado_aprobacion' => 'pendiente',
            'fecha' => now(),
        ]);

        return response()->json([
            'mensaje' => 'Reseña enviada correctamente. Será visible cuando sea aprobada.',
            'resena' => $resena,
        ], 201);
    }

    public function indexAdmin(): JsonResponse
    {
        $resenas = Resena::query()
            ->orderByDesc('fecha')
            ->get();

        return response()->json([
            'resenas' => $resenas,
        ]);
    }

    public function update(Request $request, Resena $resena): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre_cliente' => ['sometimes', 'string', 'max:255'],
            'comentario' => ['nullable', 'string'],
            'calificacion' => ['sometimes', 'integer', 'min:1', 'max:5'],
            'estado_aprobacion' => ['sometimes', 'string', 'in:pendiente,aprobado,rechazado'],
        ], [
            'calificacion.min' => 'La calificación mínima es 1.',
            'calificacion.max' => 'La calificación máxima es 5.',
            'estado_aprobacion.in' => 'El estado de aprobación no es válido.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de la reseña inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $resena->update($validator->validated());

        return response()->json([
            'mensaje' => 'Reseña actualizada correctamente.',
            'resena' => $resena->fresh(),
        ]);
    }

    public function destroy(Resena $resena): JsonResponse
    {
        $resena->delete();

        return response()->json([
            'mensaje' => 'Reseña eliminada correctamente.',
        ]);
    }
}
