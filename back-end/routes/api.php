<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CitaController;
use App\Http\Controllers\HorarioDisponibleController;
use App\Http\Controllers\PreguntaChatbotController;
use App\Http\Controllers\ReplicateController;
use App\Http\Controllers\ResenaController;
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

    Route::prefix('resenas')->group(function () {
        Route::get('/', [ResenaController::class, 'index']);
        Route::post('/', [ResenaController::class, 'store']);
    });

    Route::prefix('horarios')->group(function () {
        Route::get('/disponibles', [HorarioDisponibleController::class, 'index']);
    });

    Route::prefix('citas')->group(function () {
        Route::post('/', [CitaController::class, 'store']);
    });

    Route::prefix('chatbot')->group(function () {
        Route::get('/preguntas', [PreguntaChatbotController::class, 'index']);
    });

    Route::prefix('replicate')->group(function () {
        Route::post('/probar-diseno', [ReplicateController::class, 'probarDiseno']);
    });

    // --- Autenticación de administradores (JWT) ---

    Route::prefix('admin')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);

        Route::middleware(['auth:admin'])->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/refresh', [AuthController::class, 'refresh']);
            Route::get('/perfil', [AuthController::class, 'perfil']);

            Route::prefix('servicios')->group(function () {
                Route::get('/', [ServicioController::class, 'index']);
                Route::post('/', [ServicioController::class, 'store']);
                Route::get('/{servicio}', [ServicioController::class, 'show']);
                Route::match(['put', 'patch'], '/{servicio}', [ServicioController::class, 'update']);
                Route::delete('/{servicio}', [ServicioController::class, 'destroy']);
            });

            Route::prefix('citas')->group(function () {
                Route::get('/', [CitaController::class, 'index']);
            });

            Route::prefix('resenas')->group(function () {
                Route::get('/', [ResenaController::class, 'indexAdmin']);
                Route::patch('/{resena}', [ResenaController::class, 'update']);
                Route::delete('/{resena}', [ResenaController::class, 'destroy']);
            });

            Route::prefix('horarios')->group(function () {
                Route::post('/', [HorarioDisponibleController::class, 'store']);
            });
        });
    });
});
