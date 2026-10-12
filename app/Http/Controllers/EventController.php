<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\Event;
use App\Models\EventSubmission;
use App\Models\Raffle;
use App\Models\Student;
use App\Support\EventForm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Eventos para las familias: página temática, formulario y sorteos.
 */
class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $events = Event::query()
            ->when(! $request->user()->isAdmin(), fn ($q) => $q->where('published', true))
            ->with('banner')
            ->orderByRaw('date < ?', [today()->toDateString()])
            ->orderBy('date')
            ->get();

        return Inertia::render('events/index', [
            'events' => $events->map(fn (Event $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'date' => $event->date->toDateString(),
                'theme' => $event->theme,
                'banner' => $event->banner?->toClient(),
                'published' => $event->published,
                'past' => $event->date->lt(today()),
            ]),
        ]);
    }

    public function show(Request $request, Event $event): Response
    {
        $user = $request->user();
        abort_unless($event->published || $user->isAdmin(), 404);

        $event->load(['banner', 'raffles.winner.buyer']);
        $children = $user->hasRole(Role::Parent) ? $user->children()->get() : collect();
        $mine = $event->submissions()->where('user_id', $user->id)->get();

        return Inertia::render('events/show', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'date' => $event->date->toDateString(),
                'theme' => $event->theme,
                'banner' => $event->banner?->toClient(),
                'form_schema' => $event->form_schema ?? [],
                'per_student' => $event->per_student,
                'registration_open' => $event->registration_open,
                'published' => $event->published,
            ],
            'children' => $children->map(fn (Student $student) => ['id' => $student->id, 'name' => $student->fullName()]),
            'mySubmissions' => $mine->map(fn (EventSubmission $submission) => [
                'student_id' => $submission->student_id,
                'data' => $submission->data,
            ]),
            'raffles' => $event->raffles->map(fn (Raffle $raffle) => [
                'id' => $raffle->id,
                'title' => $raffle->title,
                'prize' => $raffle->prize,
                'ticket_price' => (float) $raffle->ticket_price,
                'draw_at' => $raffle->draw_at?->toIso8601String(),
                'status' => $raffle->status,
                'seed' => $raffle->seed,
                'winner' => $raffle->winner ? ['number' => $raffle->winner->number, 'name' => $raffle->winner->holderName()] : null,
                'my_tickets' => $raffle->tickets()->where('buyer_id', $user->id)->pluck('number'),
            ]),
            'canRespond' => $user->hasRole(Role::Parent) && $event->registration_open && $event->published,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    public function submit(Request $request, Event $event): RedirectResponse
    {
        $user = $request->user();
        abort_unless($event->published && $event->registration_open && $user->hasRole(Role::Parent), 403);

        $schema = $event->form_schema ?? [];
        $data = $request->validate([
            'student_id' => $event->per_student
                ? ['required', Rule::in($user->children()->pluck('students.id'))]
                : ['nullable'],
            ...EventForm::answerRules($schema),
        ], [], ['student_id' => 'alumno', ...EventForm::answerAttributes($schema)]);

        $answers = collect($schema)->mapWithKeys(fn ($field) => [
            $field['key'] => $field['type'] === 'checkbox'
                ? (bool) ($data['data'][$field['key']] ?? false)
                : ($data['data'][$field['key']] ?? null),
        ])->all();

        EventSubmission::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $user->id, 'student_id' => $event->per_student ? $data['student_id'] : null],
            ['data' => $answers],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => '¡Gracias! Recibimos tu respuesta.']);

        return back();
    }
}
