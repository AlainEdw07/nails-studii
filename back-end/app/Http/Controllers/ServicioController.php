<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use Illuminate\Http\JsonResponse;

class ServicioController extends Controller
{
    public function index(): JsonResponse
    {
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

        return response()->json([
            'servicios' => $servicios,
        ]);
    }
}
