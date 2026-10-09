<?php

namespace App\Http\Requests;

use App\Enums\BlockType;
use App\Enums\LearningArea;
use App\Enums\ModuleStatus;
use App\Models\Classroom;
use App\Models\LearningModule;
use App\Models\Media;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class LearningModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $module = $this->route('module');

        return $module instanceof LearningModule
            ? $this->user()->can('update', $module)
            : $this->user()->can('create', [LearningModule::class, $this->route('classroom')]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'area' => ['required', Rule::enum(LearningArea::class)],
            'summary' => ['nullable', 'string', 'max:2000'],
            'goals' => ['array', 'max:15'],
            'goals.*' => ['nullable', 'string', 'max:200'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after_or_equal:starts_on'],
            'status' => ['required', Rule::enum(ModuleStatus::class)],
            'cover_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'blocks' => ['array', 'max:40'],
            'blocks.*.type' => ['required', Rule::enum(BlockType::class)],
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
    public function attributes(): array
    {
        return [
            'title' => 'título',
            'area' => 'área',
            'summary' => 'resumen',
            'goals.*' => 'logro',
            'starts_on' => 'fecha de inicio',
            'ends_on' => 'fecha de fin',
            'blocks.*.content.body' => 'texto',
            'blocks.*.content.youtube_url' => 'enlace de YouTube',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $classroom = $this->classroom();
                $folder = "salones/{$classroom->id}";
                $cloudinary = app(CloudinaryService::class);

                $mediaIds = collect($this->input('blocks', []))->pluck('media_id')
                    ->push($this->input('cover_media_id'))
                    ->filter();
                $media = Media::query()->whereKey($mediaIds)->get()->keyBy('id');

                foreach ($media as $item) {
                    if (! $cloudinary->belongsToFolder($item->public_id, $folder)) {
                        $validator->errors()->add('blocks', 'Uno de los archivos no pertenece a este salón.');
                    }
                }

                foreach ($this->input('blocks', []) as $index => $block) {
                    $type = BlockType::tryFrom($block['type'] ?? '');
                    $content = $block['content'] ?? [];
                    $mediaId = $block['media_id'] ?? null;

                    $error = match ($type) {
                        BlockType::Text, BlockType::Activity => blank($content['body'] ?? null) ? 'Escribe el texto del bloque.' : null,
                        BlockType::Image, BlockType::File => blank($mediaId) ? 'Sube un archivo para este bloque.' : null,
                        BlockType::Video => blank($mediaId) && blank($content['youtube_url'] ?? null) ? 'Sube un video o pega un enlace de YouTube.' : null,
                        default => null,
                    };

                    if ($error) {
                        $validator->errors()->add("blocks.{$index}", $error);
                    }
                }
            },
        ];
    }

    private function classroom(): Classroom
    {
        $module = $this->route('module');

        return $module instanceof LearningModule ? $module->classroom : $this->route('classroom');
    }
}
