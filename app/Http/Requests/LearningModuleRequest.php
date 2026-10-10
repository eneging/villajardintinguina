<?php

namespace App\Http\Requests;

use App\Enums\BlockType;
use App\Enums\LearningArea;
use App\Enums\ModuleStatus;
use App\Models\Classroom;
use App\Models\LearningModule;
use App\Support\ContentBlocks;
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
            ...ContentBlocks::rules([BlockType::Text, BlockType::Image, BlockType::Video, BlockType::File, BlockType::Activity]),
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
            ...ContentBlocks::attributes(),
        ];
    }

    public function after(): array
    {
        return [
            fn (Validator $validator) => ContentBlocks::validate(
                $validator,
                $this->input('blocks', []),
                $this->input('cover_media_id'),
                "salones/{$this->classroom()->id}",
            ),
        ];
    }

    private function classroom(): Classroom
    {
        $module = $this->route('module');

        return $module instanceof LearningModule ? $module->classroom : $this->route('classroom');
    }
}
