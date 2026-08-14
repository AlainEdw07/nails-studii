<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WhatsAppPromotionController extends Controller
{
    protected WhatsAppService $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Enviar promoción a usuarios con consentimiento
     */
    public function sendPromotion(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message' => ['required', 'string', 'max:1000'],
        ], [
            'message.required' => 'El mensaje de la promoción es obligatorio.',
            'message.max' => 'El mensaje no puede exceder los 1000 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de la promoción inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        // Obtener solo usuarios con consentimiento y número de teléfono
        $usersWithConsent = User::where('whatsapp_consent', true)
            ->whereNotNull('number')
            ->where('number', '!=', '')
            ->get();

        if ($usersWithConsent->isEmpty()) {
            return response()->json([
                'mensaje' => 'No hay usuarios con consentimiento para recibir mensajes.',
                'enviados' => 0,
            ]);
        }

        $message = $request->input('message');
        $successCount = 0;
        $failedCount = 0;
        $failedNumbers = [];

        foreach ($usersWithConsent as $user) {
            if ($this->whatsappService->sendPromotion($user->number, $message)) {
                $successCount++;
            } else {
                $failedCount++;
                $failedNumbers[] = $user->number;
            }
        }

        return response()->json([
            'mensaje' => 'Proceso de envío de promociones completado.',
            'total_usuarios' => $usersWithConsent->count(),
            'enviados_exitosamente' => $successCount,
            'fallidos' => $failedCount,
            'numeros_fallidos' => $failedNumbers,
        ]);
    }

    /**
     * Enviar actualización a usuarios con consentimiento
     */
    public function sendUpdate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message' => ['required', 'string', 'max:1000'],
        ], [
            'message.required' => 'El mensaje de actualización es obligatorio.',
            'message.max' => 'El mensaje no puede exceder los 1000 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de la actualización inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        // Obtener solo usuarios con consentimiento y número de teléfono
        $usersWithConsent = User::where('whatsapp_consent', true)
            ->whereNotNull('number')
            ->where('number', '!=', '')
            ->get();

        if ($usersWithConsent->isEmpty()) {
            return response()->json([
                'mensaje' => 'No hay usuarios con consentimiento para recibir mensajes.',
                'enviados' => 0,
            ]);
        }

        $message = $request->input('message');
        $successCount = 0;
        $failedCount = 0;
        $failedNumbers = [];

        foreach ($usersWithConsent as $user) {
            if ($this->whatsappService->sendUpdate($user->number, $message)) {
                $successCount++;
            } else {
                $failedCount++;
                $failedNumbers[] = $user->number;
            }
        }

        return response()->json([
            'mensaje' => 'Proceso de envío de actualizaciones completado.',
            'total_usuarios' => $usersWithConsent->count(),
            'enviados_exitosamente' => $successCount,
            'fallidos' => $failedCount,
            'numeros_fallidos' => $failedNumbers,
        ]);
    }

    /**
     * Obtener estadísticas de usuarios con consentimiento
     */
    public function getConsentStats(): JsonResponse
    {
        $totalUsers = User::count();
        $usersWithConsent = User::where('whatsapp_consent', true)
            ->whereNotNull('number')
            ->where('number', '!=', '')
            ->count();
        $usersWithoutConsent = $totalUsers - $usersWithConsent;

        return response()->json([
            'total_usuarios' => $totalUsers,
            'con_consentimiento' => $usersWithConsent,
            'sin_consentimiento' => $usersWithoutConsent,
            'porcentaje_consentimiento' => $totalUsers > 0
                ? round(($usersWithConsent / $totalUsers) * 100, 2)
                : 0,
        ]);
    }
}
