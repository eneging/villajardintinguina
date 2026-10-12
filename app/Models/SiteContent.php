<?php

namespace App\Models;

use App\Support\SiteDefaults;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Una fila por sección del sitio público (hero, nosotros, servicios…).
 */
#[Fillable(['section', 'value', 'updated_by'])]
class SiteContent extends Model
{
    private const CACHE_KEY = 'site_content';

    protected function casts(): array
    {
        return ['value' => 'array'];
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
        static::deleted(fn () => Cache::forget(self::CACHE_KEY));
    }

    /**
     * Todas las secciones: lo guardado sobre los valores por defecto.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function sections(): array
    {
        $stored = Cache::rememberForever(self::CACHE_KEY, fn () => self::query()->pluck('value', 'section')->all());

        return collect(SiteDefaults::all())
            ->map(fn (array $defaults, string $section) => array_replace($defaults, Arr::only($stored[$section] ?? [], array_keys($defaults))))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public static function section(string $section): array
    {
        return self::sections()[$section] ?? [];
    }

    /**
     * Agrega al lado de cada `*_media_id` el archivo listo para el navegador
     * (`photo_media_id` → `photo`), cargando todos los archivos en una sola consulta.
     *
     * @param  array<string, mixed>  $content
     * @return array<string, mixed>
     */
    public static function withMedia(array $content): array
    {
        $ids = [];
        array_walk_recursive($content, function ($value, $key) use (&$ids) {
            if (is_string($key) && Str::endsWith($key, '_media_id') && $value) {
                $ids[] = (int) $value;
            }
        });

        $media = Media::query()->whereIn('id', array_unique($ids))->get()->keyBy('id');

        $resolve = function (array $data) use (&$resolve, $media): array {
            foreach ($data as $key => $value) {
                if (is_array($value)) {
                    $data[$key] = $resolve($value);
                } elseif (is_string($key) && Str::endsWith($key, '_media_id')) {
                    $data[Str::beforeLast($key, '_media_id')] = $value ? $media->get((int) $value)?->toClient() : null;
                }
            }

            return $data;
        };

        return $resolve($content);
    }
}
