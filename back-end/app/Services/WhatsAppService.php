<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $builderBotUrl;

    public function __construct()
    {
        $this->builderBotUrl = env('BUILDERBOT_URL', 'http://localhost:3008/v1/messages');
    }

    /**
     * Enviar un mensaje de WhatsApp a un número específico
     */
    public function sendMessage(string $number, string $message): bool
    {
        try {
            Log::info('Intentando enviar mensaje por WhatsApp:', [
                'url' => $this->builderBotUrl,
                'number' => $number,
                'message' => $message,
            ]);

            $response = Http::timeout(10)->post($this->builderBotUrl, [
                'number' => $number,
                'message' => $message,
            ]);

            Log::info('Respuesta de BuilderBot:', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body' => $response->body(),
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('No se pudo enviar mensaje por WhatsApp:', [
                'error' => $e->getMessage(),
                'number' => $number,
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Enviar mensaje de promoción
     */
    public function sendPromotion(string $number, string $promotionMessage): bool
    {
        return $this->sendMessage($number, $promotionMessage);
    }

    /**
     * Enviar mensaje de actualización
     */
    public function sendUpdate(string $number, string $updateMessage): bool
    {
        return $this->sendMessage($number, $updateMessage);
    }

    /**
     * Enviar mensaje de confirmación de registro
     */
    public function sendRegistrationConfirmation(string $number): bool
    {
        $message = '¡Hola! 🌸 Te has registrado exitosamente para recibir nuestras promociones exclusivas en Nails Studii. ¡Gracias por sumarte! ✨';

        return $this->sendMessage($number, $message);
    }
}