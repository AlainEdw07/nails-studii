<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ReplicateController extends Controller
{
    public function probarDiseno(Request $request)
    {
        $validated = $request->validate([
            'foto_mano'   => 'required|string',   // base64 data URI
            'diseno_img'  => 'required|string',   // base64 data URI del diseño
            'descripcion' => 'nullable|string|max:500',
        ]);

        $token       = config('services.replicate.token');
        $modelConfig = config('services.replicate.model_version');

        if (! $token) {
            return response()->json(['error' => 'Replicate API token no configurado.'], 500);
        }

        $input = $this->buildInput($validated);

        // Replicate soporta dos formatos:
        // - Con hash:   POST /v1/predictions         { version: "owner/model:hash", input }
        // - Por nombre: POST /v1/models/owner/model/predictions { input }
        if (str_contains($modelConfig, ':')) {
            $endpoint = 'https://api.replicate.com/v1/predictions';
            $payload  = ['version' => $modelConfig, 'input' => $input];
        } else {
            $endpoint = "https://api.replicate.com/v1/models/{$modelConfig}/predictions";
            $payload  = ['input' => $input];
        }

        // Iniciar la predicción
        $response = Http::withToken($token)->post($endpoint, $payload);

        if (! $response->successful()) {
            return response()->json([
                'error'   => 'Error al iniciar la predicción en Replicate.',
                'detalle' => $response->json(),
            ], 502);
        }

        $prediction = $response->json();

        // Sondear hasta obtener el resultado (máx ~60 seg)
        $maxIntentos = 30;
        $intento     = 0;

        while ($intento < $maxIntentos) {
            sleep(2);
            $intento++;

            $poll = Http::withToken($token)
                ->get("https://api.replicate.com/v1/predictions/{$prediction['id']}");

            $resultado = $poll->json();

            if (($resultado['status'] ?? '') === 'succeeded') {
                $output = $resultado['output'];
                // Algunos modelos retornan array, otros string
                return response()->json([
                    'status' => 'succeeded',
                    'url'    => is_array($output) ? $output[0] : $output,
                ]);
            }

            if (($resultado['status'] ?? '') === 'failed') {
                return response()->json([
                    'error'   => 'La generación falló.',
                    'detalle' => $resultado['error'] ?? null,
                ], 500);
            }
        }

        return response()->json(['error' => 'Tiempo de espera agotado.'], 504);
    }

    private function buildInput(array $validated): array
    {
        $descripcion = $validated['descripcion'] ?? '';
        $promptBase  = $descripcion
            ? "Close-up photorealistic photo of a hand with nail art: {$descripcion}. Professional nail salon photography, sharp focus, high quality."
            : 'Close-up photorealistic photo of a hand with beautiful elegant nail art design. Professional nail salon photography, sharp focus, high quality.';

        return [
            'prompt'              => $promptBase,
            'style_reference_images' => [
                $validated['foto_mano'],
                $validated['diseno_img'],
            ],
            'style_type'          => 'General',
            'aspect_ratio'        => '1:1',
            'magic_prompt_option' => 'Off',
            'negative_prompt'     => 'blurry, low quality, distorted fingers, deformed hands, ugly nails, amateur',
        ];
    }
}
