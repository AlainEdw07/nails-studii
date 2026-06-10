<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'correo' => ['required', 'email'],
            'contrasena' => ['required', 'string'],
        ], [
            'correo.required' => 'El correo es obligatorio.',
            'correo.email' => 'El correo no tiene un formato válido.',
            'contrasena.required' => 'La contraseña es obligatoria.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de acceso inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $credentials = [
            'correo' => $request->correo,
            'password' => $request->contrasena,
        ];

        if (! $token = auth('admin')->attempt($credentials)) {
            return response()->json([
                'mensaje' => 'Credenciales incorrectas.',
            ], 401);
        }

        return $this->respondWithToken($token);
    }

    public function logout(): JsonResponse
    {
        auth('admin')->logout();

        return response()->json([
            'mensaje' => 'Sesión cerrada correctamente.',
        ]);
    }

    public function perfil(): JsonResponse
    {
        return response()->json([
            'administrador' => auth('admin')->user(),
        ]);
    }

    public function refresh(): JsonResponse
    {
        return $this->respondWithToken(auth('admin')->refresh());
    }

    protected function respondWithToken(string $token): JsonResponse
    {
        return response()->json([
            'mensaje' => 'Inicio de sesión exitoso.',
            'token' => $token,
            'tipo_token' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'administrador' => auth('admin')->user(),
        ]);
    }
}
