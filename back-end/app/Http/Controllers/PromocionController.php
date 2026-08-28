<?php

namespace App\Http\Controllers;

use App\Models\Promocion;
use App\Models\Servicio;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PromocionController extends Controller
{
    protected WhatsAppService $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    public function index(): JsonResponse
    {
        $promociones = Promocion::with('servicios:id,nombre,precio')->get();

        return response()->json([
            'promociones' => $promociones,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'tipo_descuento' => ['required', 'in:porcentaje,monto_fijo,2x1,servicio_gratis'],
            'valor_descuento' => ['nullable', 'numeric', 'min:0'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after:fecha_inicio'],
            'condiciones' => ['nullable', 'string'],
            'codigo_promocional' => ['nullable', 'string', 'unique:promociones,codigo_promocional'],
            'usos_maximos' => ['nullable', 'integer', 'min:1'],
            'aplica_todos_servicios' => ['boolean'],
            'frecuencia_whatsapp' => ['nullable', 'in:sin_envio,unica,diaria,semanal,quincenal,mensual'],
            'servicio_ids' => ['nullable', 'array'],
            'servicio_ids.*' => ['exists:servicios,id'],
        ], [
            'nombre.required' => 'El nombre de la promoción es obligatorio.',
            'tipo_descuento.required' => 'El tipo de descuento es obligatorio.',
            'tipo_descuento.in' => 'El tipo de descuento debe ser: porcentaje, monto_fijo, 2x1 o servicio_gratis.',
            'fecha_inicio.required' => 'La fecha de inicio es obligatoria.',
            'fecha_fin.required' => 'La fecha de fin es obligatoria.',
            'fecha_fin.after' => 'La fecha de fin debe ser posterior a la fecha de inicio.',
            'codigo_promocional.unique' => 'El código promocional ya está en uso.',
            'servicio_ids.*.exists' => 'Uno de los servicios seleccionados no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de la promoción inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $promocion = Promocion::create([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'tipo_descuento' => $validated['tipo_descuento'],
            'valor_descuento' => $validated['valor_descuento'] ?? null,
            'fecha_inicio' => $validated['fecha_inicio'],
            'fecha_fin' => $validated['fecha_fin'],
            'condiciones' => $validated['condiciones'] ?? null,
            'codigo_promocional' => $validated['codigo_promocional'] ?? null,
            'usos_maximos' => $validated['usos_maximos'] ?? null,
            'aplica_todos_servicios' => $validated['aplica_todos_servicios'] ?? false,
            'frecuencia_whatsapp' => $validated['frecuencia_whatsapp'] ?? 'sin_envio',
            'estado' => 'activo',
        ]);

        // Asociar servicios si no aplica a todos
        if (! $promocion->aplica_todos_servicios && isset($validated['servicio_ids'])) {
            $promocion->servicios()->attach($validated['servicio_ids']);
        }

        $promocion->load('servicios:id,nombre,precio');

        return response()->json([
            'mensaje' => 'Promoción creada correctamente.',
            'promocion' => $promocion,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $promocion = Promocion::with('servicios:id,nombre,precio')->find($id);

        if (! $promocion) {
            return response()->json([
                'mensaje' => 'Promoción no encontrada.',
            ], 404);
        }

        return response()->json([
            'promocion' => $promocion,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $promocion = Promocion::find($id);

        if (! $promocion) {
            return response()->json([
                'mensaje' => 'Promoción no encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => ['string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'tipo_descuento' => ['in:porcentaje,monto_fijo,2x1,servicio_gratis'],
            'valor_descuento' => ['nullable', 'numeric', 'min:0'],
            'fecha_inicio' => ['date'],
            'fecha_fin' => ['date', 'after:fecha_inicio'],
            'condiciones' => ['nullable', 'string'],
            'codigo_promocional' => ['nullable', 'string', 'unique:promociones,codigo_promocional,'.$id],
            'usos_maximos' => ['nullable', 'integer', 'min:1'],
            'estado' => ['in:activo,inactivo,agotado'],
            'aplica_todos_servicios' => ['boolean'],
            'frecuencia_whatsapp' => ['nullable', 'in:sin_envio,unica,diaria,semanal,quincenal,mensual'],
            'servicio_ids' => ['nullable', 'array'],
            'servicio_ids.*' => ['exists:servicios,id'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Datos de la promoción inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $promocion->update($validated);

        // Actualizar servicios si se proporcionan
        if (isset($validated['servicio_ids'])) {
            if ($promocion->aplica_todos_servicios) {
                $promocion->servicios()->detach();
            } else {
                $promocion->servicios()->sync($validated['servicio_ids']);
            }
        }

        $promocion->load('servicios:id,nombre,precio');

        return response()->json([
            'mensaje' => 'Promoción actualizada correctamente.',
            'promocion' => $promocion,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $promocion = Promocion::find($id);

        if (! $promocion) {
            return response()->json([
                'mensaje' => 'Promoción no encontrada.',
            ], 404);
        }

        $promocion->delete();

        return response()->json([
            'mensaje' => 'Promoción eliminada correctamente.',
        ]);
    }

    public function activas(): JsonResponse
    {
        $hoy = now()->toDateString();
        $promociones = Promocion::where('estado', 'activo')
            ->where('fecha_inicio', '<=', $hoy)
            ->where('fecha_fin', '>=', $hoy)
            ->where(function ($q) {
                $q->whereNull('usos_maximos')
                    ->orWhereColumn('usos_actuales', '<', 'usos_maximos');
            })
            ->with('servicios:id,nombre,precio')
            ->get();

        return response()->json([
            'promociones' => $promociones,
        ]);
    }

    /**
     * Enviar promoción seleccionada por WhatsApp a usuarios con consentimiento
     */
    public function enviarWhatsApp(Request $request, int $id): JsonResponse
    {
        $promocion = Promocion::find($id);

        if (! $promocion) {
            return response()->json([
                'mensaje' => 'Promoción no encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'frecuencia_whatsapp' => ['nullable', 'in:sin_envio,unica,diaria,semanal,quincenal,mensual'],
            'mensaje_personalizado' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'mensaje' => 'Parámetros de envío por WhatsApp inválidos.',
                'errores' => $validator->errors(),
            ], 422);
        }

        if ($request->filled('frecuencia_whatsapp')) {
            $promocion->frecuencia_whatsapp = $request->input('frecuencia_whatsapp');
            $promocion->save();
        }

        // Obtener usuarios con consentimiento
        $usersWithConsent = User::where('whatsapp_consent', true)
            ->whereNotNull('number')
            ->where('number', '!=', '')
            ->get();

        if ($usersWithConsent->isEmpty()) {
            return response()->json([
                'mensaje' => 'No hay usuarios registrados con consentimiento para recibir promociones por WhatsApp.',
                'frecuencia_programada' => $promocion->frecuencia_whatsapp,
                'enviados' => 0,
                'promocion' => $promocion,
            ]);
        }

        // Construir mensaje
        $customMsg = $request->input('mensaje_personalizado');
        if (! empty($customMsg)) {
            $mensaje = $customMsg;
        } else {
            $descuentoTexto = '';
            if ($promocion->tipo_descuento === 'porcentaje') {
                $descuentoTexto = "Descuento: {$promocion->valor_descuento}% OFF";
            } elseif ($promocion->tipo_descuento === 'monto_fijo') {
                $descuentoTexto = "Descuento de \${$promocion->valor_descuento}";
            } elseif ($promocion->tipo_descuento === '2x1') {
                $descuentoTexto = 'Promoción 2x1';
            } else {
                $descuentoTexto = 'Servicio Gratis';
            }

            $codigoTexto = $promocion->codigo_promocional ? "\n🎟 Código: *{$promocion->codigo_promocional}*" : '';
            $descTexto = $promocion->descripcion ? "\n📝 {$promocion->descripcion}" : '';
            $frecuenciaLabel = ucfirst($promocion->frecuencia_whatsapp ?? 'unica');

            $mensaje = "🎉 *¡Novedades en Nails Studio!* 🌸\n\n"
                ."✨ *{$promocion->nombre}*\n"
                ."🏷 *{$descuentoTexto}*{$descTexto}{$codigoTexto}\n"
                ."📅 Válido del {$promocion->fecha_inicio} al {$promocion->fecha_fin}\n"
                ."🔔 Frecuencia de difusión: {$frecuenciaLabel}\n\n"
                ."¡Agenda tu cita con nosotros y aprovecha esta súper promoción! 💅✨";
        }

        $successCount = 0;
        $failedCount = 0;
        $failedNumbers = [];

        foreach ($usersWithConsent as $user) {
            if ($this->whatsappService->sendPromotion($user->number, $mensaje)) {
                $successCount++;
            } else {
                $failedCount++;
                $failedNumbers[] = $user->number;
            }
        }

        return response()->json([
            'mensaje' => "Envío de la promoción '{$promocion->nombre}' procesado correctamente.",
            'frecuencia_programada' => $promocion->frecuencia_whatsapp,
            'total_usuarios' => $usersWithConsent->count(),
            'enviados_exitosamente' => $successCount,
            'fallidos' => $failedCount,
            'numeros_fallidos' => $failedNumbers,
            'promocion' => $promocion,
        ]);
    }
}
