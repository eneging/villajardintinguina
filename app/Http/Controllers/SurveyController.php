<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Encuestas para responder (familias y personal).
 */
class SurveyController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $answered = $user->surveyResponses()->pluck('survey_id');

        return Inertia::render('surveys/index', [
            'surveys' => Survey::query()->where('published', true)->latest()->get()
                ->filter(fn (Survey $survey) => $survey->isFor($user))
                ->values()
                ->map(fn (Survey $survey) => [
                    'id' => $survey->id,
                    'title' => $survey->title,
                    'description' => $survey->description,
                    'closes_on' => $survey->closes_on?->toDateString(),
                    'open' => $survey->isOpen(),
                    'answered' => $answered->contains($survey->id),
                    'questions_count' => count($survey->questions),
                ]),
        ]);
    }

    public function show(Request $request, Survey $survey): Response
    {
        abort_unless($survey->published && $survey->isFor($request->user()), 404);

        return Inertia::render('surveys/show', [
            'survey' => $survey->only(['id', 'title', 'description', 'questions', 'anonymous']),
            'open' => $survey->isOpen(),
            'answered' => $survey->responses()->where('user_id', $request->user()->id)->exists(),
        ]);
    }

    public function submit(Request $request, Survey $survey): RedirectResponse
    {
        abort_unless($survey->isOpen() && $survey->isFor($request->user()), 403);
        abort_if($survey->responses()->where('user_id', $request->user()->id)->exists(), 422, 'Ya respondiste esta encuesta.');

        $rules = [];

        foreach ($survey->questions as $question) {
            $key = "answers.{$question['key']}";
            $required = ($question['required'] ?? true) ? 'required' : 'nullable';
            $rules[$key] = match ($question['type']) {
                'rating' => [$required, 'integer', 'between:1,5'],
                'choice' => [$required, Rule::in($question['options'] ?? [])],
                default => [$required, 'string', 'max:2000'],
            };
        }

        $data = $request->validate($rules, ['*.required' => 'Responde esta pregunta.']);

        $survey->responses()->create(['user_id' => $request->user()->id, 'answers' => $data['answers'] ?? []]);
        Inertia::flash('toast', ['type' => 'success', 'message' => '¡Gracias por tu opinión!']);

        return to_route('surveys.index');
    }
}
