<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CitaController;
use App\Http\Controllers\HorarioDisponibleController;
use App\Http\Controllers\ServicioController;
use Illuminate\Support\Facades\Route;

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
        Route::get('/', [ServicioController::class, 'index']);
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
        Route::get('/disponibles', [HorarioDisponibleController::class, 'index']);
    });

    Route::prefix('citas')->group(function () {
        Route::post('/', [CitaController::class, 'store']);
    });

    Route::prefix('informacion-negocio')->group(function () {
        // Route::get('/', [InformacionNegocioController::class, 'show']);
    });

    Route::prefix('chatbot')->group(function () {
        // Route::get('/preguntas', [PreguntaChatbotController::class, 'index']);
        // Route::post('/preguntar', [ChatbotController::class, 'preguntar']);
    });

    // --- Autenticación de administradores (JWT) ---

    Route::prefix('admin')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);

        Route::middleware(['auth:admin'])->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/refresh', [AuthController::class, 'refresh']);
            Route::get('/perfil', [AuthController::class, 'perfil']);

            Route::prefix('servicios')->group(function () {
                // Route::apiResource('/', ServicioController::class);
            });

            Route::prefix('citas')->group(function () {
                Route::get('/', [CitaController::class, 'index']);
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
                Route::post('/', [HorarioDisponibleController::class, 'store']);
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
});
