<?php

namespace App\Support;

use App\Enums\BlockType;
use App\Models\InductionLesson;
use App\Models\LearningModule;
use App\Models\Media;
use App\Services\CloudinaryService;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Validación y guardado de bloques de contenido (texto, imagen, video, PDF,
 * actividad, confirmación), compartidos por módulos de aprendizaje e inducción.
 */
class ContentBlocks
{
    /**
     * @param  list<BlockType>  $allowed
     * @return array<string, mixed>
     */
    public static function rules(array $allowed): array
    {
        return [
            'cover_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'blocks' => ['array', 'max:40'],
            'blocks.*.type' => ['required', Rule::in(array_map(fn (BlockType $type) => $type->value, $allowed))],
            'blocks.*.content' => ['array'],
            'blocks.*.content.body' => ['nullable', 'string', 'max:10000'],
            'blocks.*.content.title' => ['nullable', 'string', 'max:150'],
            'blocks.*.content.caption' => ['nullable', 'string', 'max:300'],
            'blocks.*.content.youtube_url' => ['nullable', 'url', 'regex:/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//'],
            'blocks.*.media_id' => ['nullable', 'integer', 'exists:media,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function attributes(): array
    {
        return [
            'blocks.*.content.body' => 'texto',
            'blocks.*.content.youtube_url' => 'enlace de YouTube',
        ];
    }

    /**
     * Cada bloque debe tener su contenido y los archivos deben estar en la carpeta permitida.
     *
     * @param  array<int, array<string, mixed>>  $blocks
     */
    public static function validate(Validator $validator, array $blocks, mixed $coverMediaId, string $folder): void
    {
        $cloudinary = app(CloudinaryService::class);
        $mediaIds = collect($blocks)->pluck('media_id')->push($coverMediaId)->filter();

        foreach (Media::query()->whereKey($mediaIds)->get() as $media) {
            if (! $cloudinary->belongsToFolder($media->public_id, $folder)) {
                $validator->errors()->add('blocks', 'Uno de los archivos no pertenece a esta sección.');
            }
        }

        foreach ($blocks as $index => $block) {
            $content = $block['content'] ?? [];
            $mediaId = $block['media_id'] ?? null;

            $error = match (BlockType::tryFrom($block['type'] ?? '')) {
                BlockType::Text, BlockType::Activity, BlockType::Confirmation => blank($content['body'] ?? null) ? 'Escribe el texto del bloque.' : null,
                BlockType::Image, BlockType::File => blank($mediaId) ? 'Sube un archivo para este bloque.' : null,
                BlockType::Video => blank($mediaId) && blank($content['youtube_url'] ?? null) ? 'Sube un video o pega un enlace de YouTube.' : null,
                default => null,
            };

            if ($error) {
                $validator->errors()->add("blocks.{$index}", $error);
            }
        }
    }

    /**
     * Reemplaza los bloques del modelo por los recibidos, en orden.
     *
     * @param  array<int, array<string, mixed>>  $blocks
     */
    public static function sync(LearningModule|InductionLesson $owner, array $blocks): void
    {
        $owner->blocks()->delete();

        foreach (array_values($blocks) as $position => $block) {
            $owner->blocks()->create([
                'type' => $block['type'],
                'content' => array_filter($block['content'] ?? [], 'filled'),
                'media_id' => $block['media_id'] ?? null,
                'position' => $position,
            ]);
        }
    }
}
