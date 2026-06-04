<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Las rutas definidas aquí se cargan con el prefijo /api y el middleware
| del grupo "api". Registra los controladores en app/Http/Controllers/Api.
|
*/

Route::get('/', function () {
    return response()->json([
        'nombre' => config('app.name'),
        'mensaje' => 'API de Nails Studii',
        'version' => 'v1',
    ]);
});

Route::prefix('v1')->group(function () {

    // --- Rutas públicas (sitio web / clientes) ---

    Route::prefix('servicios')->group(function () {
        // Route::get('/', [ServicioController::class, 'index']);
        // Route::get('/{servicio}', [ServicioController::class, 'show']);
    });

    Route::prefix('galeria')->group(function () {
        // Route::get('/', [GaleriaController::class, 'index']);
        // Route::get('/servicio/{servicio}', [GaleriaController::class, 'porServicio']);
    });

    Route::prefix('resenas')->group(function () {
        // Route::get('/', [ResenaController::class, 'index']);
        // Route::post('/', [ResenaController::class, 'store']);
    });

    Route::prefix('horarios')->group(function () {
        // Route::get('/disponibles', [HorarioDisponibleController::class, 'disponibles']);
    });

    Route::prefix('citas')->group(function () {
        // Route::post('/', [CitaController::class, 'store']);
        // Route::get('/{cita}', [CitaController::class, 'show']);
    });

    Route::prefix('informacion-negocio')->group(function () {
        // Route::get('/', [InformacionNegocioController::class, 'show']);
    });

    Route::prefix('chatbot')->group(function () {
        // Route::get('/preguntas', [PreguntaChatbotController::class, 'index']);
        // Route::post('/preguntar', [ChatbotController::class, 'preguntar']);
    });

    // --- Rutas de administración (proteger con auth:sanctum o similar) ---

    Route::prefix('admin')->middleware(['auth:sanctum'])->group(function () {

        Route::prefix('servicios')->group(function () {
            // Route::apiResource('/', ServicioController::class);
        });

        Route::prefix('citas')->group(function () {
            // Route::get('/', [CitaController::class, 'index']);
            // Route::patch('/{cita}/estado', [CitaController::class, 'actualizarEstado']);
            // Route::get('/{cita}/historial', [HistorialCitaController::class, 'porCita']);
        });

        Route::prefix('galeria')->group(function () {
            // Route::apiResource('/', GaleriaController::class);
        });

        Route::prefix('resenas')->group(function () {
            // Route::get('/', [ResenaController::class, 'indexAdmin']);
            // Route::patch('/{resena}', [ResenaController::class, 'update']);
            // Route::delete('/{resena}', [ResenaController::class, 'destroy']);
        });

        Route::prefix('horarios')->group(function () {
            // Route::apiResource('/', HorarioDisponibleController::class);
        });

        Route::prefix('informacion-negocio')->group(function () {
            // Route::get('/', [InformacionNegocioController::class, 'show']);
            // Route::put('/', [InformacionNegocioController::class, 'update']);
        });

        Route::prefix('preguntas-chatbot')->group(function () {
            // Route::apiResource('/', PreguntaChatbotController::class);
        });

        Route::prefix('administradores')->group(function () {
            // Route::apiResource('/', AdministradorController::class)->except(['store']);
        });
    });
});
