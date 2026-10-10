<?php

namespace App\Http\Requests;

use App\Enums\BlockType;
use App\Enums\InductionAudience;
use App\Enums\ModuleStatus;
use App\Models\InductionLesson;
use App\Services\InductionService;
use App\Support\ContentBlocks;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class InductionLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        $lesson = $this->route('lesson');

        return $lesson instanceof InductionLesson
            ? $this->user()->can('update', $lesson)
            : $this->user()->can('create', InductionLesson::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'audience' => ['required', Rule::enum(InductionAudience::class)],
            'is_required' => ['boolean'],
            'status' => ['required', Rule::enum(ModuleStatus::class)],
            'position' => ['nullable', 'integer', 'min:0', 'max:999'],
            'targets' => ['required', 'array'],
            'targets.general' => ['boolean'],
            'targets.level_ids' => ['array'],
            'targets.level_ids.*' => ['integer', 'exists:levels,id'],
            'targets.classroom_ids' => ['array'],
            'targets.classroom_ids.*' => ['integer', 'exists:classrooms,id'],
            ...ContentBlocks::rules(BlockType::cases()),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'title' => 'título',
            'description' => 'descripción',
            'audience' => 'dirigido a',
            ...ContentBlocks::attributes(),
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                ContentBlocks::validate($validator, $this->input('blocks', []), $this->input('cover_media_id'), 'induccion');

                $general = $this->boolean('targets.general');
                $levels = $this->input('targets.level_ids', []);
                $classrooms = collect($this->input('targets.classroom_ids', []));

                if (! $general && empty($levels) && $classrooms->isEmpty()) {
                    $validator->errors()->add('targets', 'Elige a quién va dirigida la lección.');
                }

                if ($this->user()->isAdmin()) {
                    return;
                }

                // La maestra solo dirige lecciones para padres de sus propios salones.
                $allowed = app(InductionService::class)->manageableClassroomIds($this->user());

                if ($general || ! empty($levels) || $classrooms->diff($allowed)->isNotEmpty()) {
                    $validator->errors()->add('targets', 'Solo puedes dirigir lecciones a tus salones.');
                }

                if ($this->input('audience') !== InductionAudience::Parents->value) {
                    $validator->errors()->add('audience', 'Solo la administradora crea inducciones para el personal.');
                }
            },
        ];
    }
}
