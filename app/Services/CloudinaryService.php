<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Integración mínima con Cloudinary sin SDK: firma subidas directas desde el
 * navegador, verifica la respuesta y construye URLs de entrega (firmadas para
 * los archivos protegidos). El API secret nunca sale del servidor.
 */
class CloudinaryService
{
    public function __construct(
        private readonly ?string $cloudName,
        private readonly ?string $apiKey,
        private readonly ?string $apiSecret,
        private readonly string $rootFolder,
    ) {}

    public static function fromConfig(): self
    {
        $url = config('services.cloudinary.url');
        $parts = $url ? parse_url($url) : [];

        return new self(
            cloudName: $parts['host'] ?? config('services.cloudinary.cloud_name'),
            apiKey: isset($parts['user']) ? urldecode($parts['user']) : config('services.cloudinary.api_key'),
            apiSecret: isset($parts['pass']) ? urldecode($parts['pass']) : config('services.cloudinary.api_secret'),
            rootFolder: config('services.cloudinary.folder', 'villajardin/local'),
        );
    }

    public function isConfigured(): bool
    {
        return filled($this->cloudName) && filled($this->apiKey) && filled($this->apiSecret);
    }

    /**
     * Parámetros para que el navegador suba un archivo directo a Cloudinary.
     *
     * @return array{upload_url: string, api_key: string, timestamp: int, signature: string, folder: string, type: string}
     */
    public function signUpload(string $folder, string $deliveryType, string $resourceType): array
    {
        $this->ensureConfigured();

        $params = [
            'folder' => $this->folder($folder),
            'timestamp' => time(),
            'type' => $deliveryType,
        ];

        return [
            'upload_url' => "https://api.cloudinary.com/v1_1/{$this->cloudName}/{$resourceType}/upload",
            'api_key' => (string) $this->apiKey,
            'timestamp' => $params['timestamp'],
            'signature' => $this->sign($params),
            'folder' => $params['folder'],
            'type' => $deliveryType,
        ];
    }

    /**
     * Verifica que los datos que el navegador nos reenvía vienen realmente de Cloudinary.
     */
    public function verifyUploadResponse(string $publicId, int|string $version, string $signature): bool
    {
        $this->ensureConfigured();

        return hash_equals($this->sign(['public_id' => $publicId, 'version' => $version]), $signature);
    }

    public function belongsToFolder(string $publicId, string $folder): bool
    {
        return Str::startsWith($publicId, $this->folder($folder).'/');
    }

    public function deliveryUrl(Media $media, ?string $transformation = null, ?string $format = null): string
    {
        $format ??= $media->format;
        $source = $media->public_id.($format && $media->resource_type !== 'raw' ? ".{$format}" : '');
        $segments = [];

        if ($media->delivery_type !== 'upload') {
            $toSign = implode('/', array_filter([$transformation, $source]));
            $segments[] = 's--'.substr($this->base64UrlSha1($toSign.$this->apiSecret), 0, 8).'--';
        }

        if ($transformation) {
            $segments[] = $transformation;
        }

        if ($media->version) {
            $segments[] = 'v'.$media->version;
        }

        $segments[] = $source;

        return "https://res.cloudinary.com/{$this->cloudName}/{$media->resource_type}/{$media->delivery_type}/".implode('/', $segments);
    }

    /**
     * Enlace de descarga que vence (para documentos sensibles). Usa la API de
     * descarga privada de Cloudinary, válida para archivos "authenticated".
     */
    public function temporaryDownloadUrl(Media $media, int $minutes = 10): string
    {
        $this->ensureConfigured();

        $params = [
            'public_id' => $media->public_id,
            'format' => $media->format,
            'type' => $media->delivery_type,
            'expires_at' => time() + $minutes * 60,
            'timestamp' => time(),
        ];
        $params['signature'] = $this->sign($params);
        $params['api_key'] = $this->apiKey;

        return "https://api.cloudinary.com/v1_1/{$this->cloudName}/{$media->resource_type}/download?".http_build_query(array_filter($params, fn ($value) => $value !== null && $value !== ''));
    }

    /**
     * URL que fuerza la descarga del archivo (foto o video de la galería).
     */
    public function downloadUrl(Media $media): string
    {
        return $this->deliveryUrl($media, 'fl_attachment');
    }

    /**
     * Elimina el archivo en Cloudinary (si falla, no interrumpe: queda huérfano y se puede limpiar luego).
     */
    public function destroy(Media $media): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        $params = ['public_id' => $media->public_id, 'timestamp' => time(), 'type' => $media->delivery_type];

        try {
            return Http::asForm()
                ->timeout(10)
                ->post("https://api.cloudinary.com/v1_1/{$this->cloudName}/{$media->resource_type}/destroy", [
                    ...$params,
                    'signature' => $this->sign($params),
                    'api_key' => $this->apiKey,
                ])
                ->json('result') === 'ok';
        } catch (Throwable) {
            return false;
        }
    }

    public function videoPosterUrl(Media $media): string
    {
        return $this->deliveryUrl($media, 'so_auto,f_jpg,q_auto,w_640', 'jpg');
    }

    /**
     * @param  array<string, scalar>  $params
     */
    public function sign(array $params): string
    {
        ksort($params);

        $payload = collect($params)
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->map(fn ($value, $key) => "{$key}={$value}")
            ->implode('&');

        return sha1($payload.$this->apiSecret);
    }

    private function folder(string $folder): string
    {
        return trim($this->rootFolder, '/').'/'.trim($folder, '/');
    }

    private function base64UrlSha1(string $value): string
    {
        return rtrim(strtr(base64_encode(sha1($value, true)), '+/', '-_'), '=');
    }

    private function ensureConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Cloudinary no está configurado. Define CLOUDINARY_URL en el archivo .env.');
        }
    }
}
