<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PromoController extends Controller
{
    protected WhatsAppService $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    public function registrar(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'number' => ['required', 'string', 'min:7', 'max:25'],
            'whatsapp_consent' => ['required', 'boolean', 'accepted'],
        ], [
            'number.required' => 'El número de teléfono es obligatorio.',
            'number.min' => 'El número de teléfono debe tener al menos 7 dígitos.',
            'whatsapp_consent.required' => 'El consentimiento para recibir mensajes de WhatsApp es obligatorio.',
            'whatsapp_consent.accepted' => 'Debes aceptar recibir mensajes de WhatsApp para registrarte.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de registro inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $rawNumber = $request->input('number');
        $cleanNumber = preg_replace('/\D/', '', $rawNumber);

        if (strlen($cleanNumber) < 7) {
            return response()->json([
                'mensaje' => 'Por favor ingresa un número de teléfono válido.',
            ], 422);
        }

        // Buscar o crear usuario registrando la columna number y consentimiento
        $user = User::where('number', $cleanNumber)->first();
        if (! $user) {
            $user = User::create([
                'name' => 'Usuario Promo ' . substr($cleanNumber, -4),
                'email' => 'promo_' . time() . '_' . rand(100, 999) . '@nails.local',
                'password' => bcrypt(Str::random(16)),
                'number' => $cleanNumber,
                'whatsapp_consent' => $request->input('whatsapp_consent'),
            ]);
        } else {
            $user->update([
                'number' => $cleanNumber,
                'whatsapp_consent' => $request->input('whatsapp_consent'),
            ]);
        }

        // Enviar mensaje por WhatsApp utilizando el servicio solo si hay consentimiento
        if ($request->input('whatsapp_consent')) {
            $this->whatsappService->sendRegistrationConfirmation($cleanNumber);
        }

        return response()->json([
            'mensaje' => 'Número registrado correctamente para promociones.',
            'usuario' => $user,
        ]);
    }
}
