<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\Notifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Encuestas de satisfacción: crear, publicar y ver resultados.
 */
class SurveyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/surveys/index', [
            'surveys' => Survey::query()->withCount('responses')->latest()->get()->map(fn (Survey $survey) => [
                'id' => $survey->id,
                'title' => $survey->title,
                'audience' => Survey::AUDIENCES[$survey->audience],
                'published' => $survey->published,
                'open' => $survey->isOpen(),
                'closes_on' => $survey->closes_on?->toDateString(),
                'responses' => $survey->responses_count,
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/surveys/form', ['survey' => null, 'audiences' => EmployeeController::options(Survey::AUDIENCES)]);
    }

    public function store(Request $request, Notifier $notifier): RedirectResponse
    {
        $survey = Survey::create([...$this->validated($request), 'created_by' => $request->user()->id]);

        if ($survey->published) {
            $this->announce($survey, $request->user(), $notifier);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Encuesta guardada.']);

        return to_route('admin.surveys.index');
    }

    public function edit(Survey $survey): Response
    {
        return Inertia::render('admin/surveys/form', [
            'survey' => [...$survey->only(['id', 'title', 'description', 'audience', 'questions', 'anonymous', 'published']), 'closes_on' => $survey->closes_on?->toDateString(), 'locked' => $survey->responses()->exists()],
            'audiences' => EmployeeController::options(Survey::AUDIENCES),
        ]);
    }

    public function update(Request $request, Survey $survey, Notifier $notifier): RedirectResponse
    {
        $data = $this->validated($request);

        // Con respuestas ya recibidas no se cambian las preguntas (los resultados quedarían mezclados).
        if ($survey->responses()->exists()) {
            unset($data['questions']);
        }

        $wasPublished = $survey->published;
        $survey->update($data);

        if (! $wasPublished && $survey->published) {
            $this->announce($survey, $request->user(), $notifier);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Encuesta actualizada.']);

        return to_route('admin.surveys.index');
    }

    public function results(Survey $survey): Response
    {
        $responses = $survey->responses()->with('user')->get();

        return Inertia::render('admin/surveys/results', [
            'survey' => $survey->only(['id', 'title', 'description', 'anonymous']),
            'total' => $responses->count(),
            'questions' => collect($survey->questions)->map(function (array $question) use ($responses, $survey) {
                $values = $responses->map(fn (SurveyResponse $response) => $response->answers[$question['key']] ?? null)->filter(fn ($v) => $v !== null && $v !== '');

                return [
                    ...$question,
                    'answered' => $values->count(),
                    'average' => $question['type'] === 'rating' && $values->isNotEmpty() ? round($values->avg(), 1) : null,
                    'distribution' => match ($question['type']) {
                        'rating' => collect(range(1, 5))->mapWithKeys(fn ($n) => [$n => $values->filter(fn ($v) => (int) $v === $n)->count()]),
                        'choice' => collect($question['options'] ?? [])->mapWithKeys(fn ($o) => [$o => $values->filter(fn ($v) => $v === $o)->count()]),
                        default => null,
                    },
                    'texts' => $question['type'] === 'text'
                        ? $responses->filter(fn ($r) => filled($r->answers[$question['key']] ?? null))->map(fn ($r) => [
                            'text' => $r->answers[$question['key']],
                            'author' => $survey->anonymous ? null : $r->user?->name,
                        ])->values()
                        : [],
                ];
            }),
        ]);
    }

    public function destroy(Survey $survey): RedirectResponse
    {
        $survey->delete();

        return to_route('admin.surveys.index');
    }

    private function announce(Survey $survey, User $by, Notifier $notifier): void
    {
        $roles = match ($survey->audience) {
            'parents' => [Role::Parent],
            'staff' => [Role::Teacher, Role::Intern],
            default => [Role::Parent, Role::Teacher, Role::Intern],
        };

        $notifier->send(
            User::query()->whereHas('roleAssignments', fn ($q) => $q->whereIn('role', $roles))->get(),
            'survey',
            "Encuesta: {$survey->title}",
            'Tu opinión nos ayuda a mejorar. Toma menos de 2 minutos.',
            route('surveys.show', $survey, false),
            $by,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'audience' => ['required', Rule::in(array_keys(Survey::AUDIENCES))],
            'anonymous' => ['boolean'],
            'published' => ['boolean'],
            'closes_on' => ['nullable', 'date'],
            'questions' => ['required', 'array', 'min:1', 'max:20'],
            'questions.*.label' => ['required', 'string', 'max:200'],
            'questions.*.type' => ['required', 'in:rating,choice,text'],
            'questions.*.required' => ['boolean'],
            'questions.*.options' => ['array', 'max:10', 'required_if:questions.*.type,choice'],
            'questions.*.options.*' => ['nullable', 'string', 'max:80'],
        ], [], ['title' => 'título', 'questions.*.label' => 'pregunta', 'questions.*.options' => 'opciones']);

        $data['questions'] = collect($data['questions'])->values()->map(fn (array $question, int $index) => [
            'key' => 'q'.($index + 1).'_'.Str::lower(Str::random(4)),
            'label' => $question['label'],
            'type' => $question['type'],
            'required' => (bool) ($question['required'] ?? true),
            'options' => $question['type'] === 'choice' ? array_values(array_filter($question['options'] ?? [])) : [],
        ])->all();

        return $data;
    }
}
