<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Envío por la API oficial de WhatsApp Cloud (Meta). Solo funciona con una
 * plantilla aprobada por Meta y tiene costo por conversación; si no está
 * configurada, la plataforma sigue usando el botón wa.me manual.
 */
class WhatsAppService
{
    public function isConfigured(): bool
    {
        return filled(config('services.whatsapp.token'))
            && filled(config('services.whatsapp.phone_number_id'))
            && filled(config('services.whatsapp.payment_template'));
    }

    /** Número peruano a formato internacional (51 + 9 dígitos). */
    public static function normalize(?string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);

        if (strlen($digits) === 9) {
            return '51'.$digits;
        }

        return strlen($digits) >= 11 ? $digits : null;
    }

    /**
     * @param  list<string>  $parameters  valores de {{1}}, {{2}}… de la plantilla
     */
    public function sendTemplate(string $phone, string $template, array $parameters): void
    {
        $to = self::normalize($phone) ?? throw new RuntimeException("Celular no válido: {$phone}");

        $response = Http::withToken(config('services.whatsapp.token'))
            ->timeout(15)
            ->post('https://graph.facebook.com/'.config('services.whatsapp.api_version', 'v21.0').'/'.config('services.whatsapp.phone_number_id').'/messages', [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $template,
                    'language' => ['code' => config('services.whatsapp.language', 'es')],
                    'components' => [[
                        'type' => 'body',
                        'parameters' => array_map(fn ($value) => ['type' => 'text', 'text' => (string) $value], $parameters),
                    ]],
                ],
            ]);

        if ($response->failed()) {
            throw new RuntimeException('WhatsApp rechazó el mensaje: '.$response->json('error.message', $response->status()));
        }
    }
}
