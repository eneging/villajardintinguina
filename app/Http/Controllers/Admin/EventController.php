<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventSubmission;
use App\Models\Media;
use App\Models\Raffle;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\Notifier;
use App\Support\EventForm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Eventos y fechas festivas: tema, formulario personalizado y respuestas.
 */
class EventController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/events/index', [
            'events' => Event::query()->withCount(['submissions', 'raffles'])->orderByDesc('date')->get()->map(fn (Event $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->date->toDateString(),
                'theme' => $event->theme,
                'published' => $event->published,
                'registration_open' => $event->registration_open,
                'submissions_count' => $event->submissions_count,
                'raffles_count' => $event->raffles_count,
            ]),
            'raffles' => Raffle::query()->withCount(['tickets as sold_count' => fn ($q) => $q->where('paid', true)])->latest()->get()->map(fn (Raffle $raffle) => [
                'id' => $raffle->id,
                'title' => $raffle->title,
                'prize' => $raffle->prize,
                'status' => $raffle->status,
                'total_tickets' => $raffle->total_tickets,
                'sold_count' => $raffle->sold_count,
                'ticket_price' => (float) $raffle->ticket_price,
            ]),
        ]);
    }

    public function create(): Response
    {
        return $this->form();
    }

    public function store(Request $request): RedirectResponse
    {
        $event = Event::create([...$this->validated($request), 'created_by' => $request->user()->id]);

        if ($event->published) {
            $this->announce($event, $request);
        }
        Inertia::flash('toast', ['type' => 'success', 'message' => $event->published ? 'Evento publicado.' : 'Evento guardado como borrador.']);

        return to_route('events.show', $event);
    }

    public function edit(Event $event): Response
    {
        return $this->form($event);
    }

    public function update(Request $request, Event $event): RedirectResponse
    {
        $wasPublished = $event->published;
        $event->update($this->validated($request));

        if (! $wasPublished && $event->published) {
            $this->announce($event, $request);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Evento actualizado.']);

        return to_route('events.show', $event);
    }

    private function announce(Event $event, Request $request): void
    {
        app(Notifier::class)->send(
            User::query()->whereHas('roleAssignments', fn ($q) => $q->whereIn('role', [Role::Parent, Role::Teacher, Role::Intern]))->get(),
            'event',
            trim(($event->theme['emoji'] ?? '').' '.$event->title),
            'Nuevo evento: revisa los detalles y el formulario.',
            route('events.show', $event, false),
            $request->user(),
        );
    }

    public function destroy(Event $event): RedirectResponse
    {
        if ($event->raffles()->whereHas('tickets', fn ($q) => $q->where('paid', true))->exists()) {
            throw ValidationException::withMessages(['event' => 'El evento tiene sorteos con tickets pagados; ocúltalo en lugar de eliminarlo.']);
        }

        $event->raffles()->delete();
        $event->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Evento eliminado.']);

        return to_route('admin.events.index');
    }

    public function submissions(Event $event): Response
    {
        $event->load('submissions.user', 'submissions.student');

        return Inertia::render('admin/events/submissions', [
            'event' => ['id' => $event->id, 'title' => $event->title, 'theme' => $event->theme, 'form_schema' => $event->form_schema ?? []],
            'submissions' => $event->submissions->sortBy('created_at')->values()->map(fn (EventSubmission $submission) => [
                'id' => $submission->id,
                'parent' => $submission->user->name,
                'student' => $submission->student?->fullName(),
                'data' => $submission->data,
                'created_at' => $submission->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function download(Event $event): StreamedResponse
    {
        $schema = $event->form_schema ?? [];
        $event->load('submissions.user', 'submissions.student');

        return response()->streamDownload(function () use ($event, $schema) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Fecha', 'Padre/Madre', 'Alumno', ...array_column($schema, 'label')], ';');

            foreach ($event->submissions as $submission) {
                fputcsv($out, [
                    $submission->created_at->format('d/m/Y H:i'),
                    $submission->user->name,
                    $submission->student?->fullName() ?? '',
                    ...array_map(fn ($field) => self::answerText($submission->data[$field['key']] ?? null), $schema),
                ], ';');
            }

            fclose($out);
        }, 'respuestas-'.str($event->title)->slug().'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function form(?Event $event = null): Response
    {
        $event?->load('banner');

        return Inertia::render('admin/events/form', [
            'event' => $event ? [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'date' => $event->date->toDateString(),
                'theme' => $event->theme,
                'banner_media_id' => $event->banner_media_id,
                'banner' => $event->banner?->toClient(),
                'form_schema' => $event->form_schema ?? [],
                'per_student' => $event->per_student,
                'registration_open' => $event->registration_open,
                'published' => $event->published,
            ] : null,
            'themes' => collect(Event::THEMES)->map(fn ($theme, $key) => ['key' => $key, ...$theme])->values(),
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:3000'],
            'date' => ['required', 'date'],
            'theme.color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.accent' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.emoji' => ['nullable', 'string', 'max:8'],
            'banner_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'per_student' => ['boolean'],
            'registration_open' => ['boolean'],
            'published' => ['boolean'],
            ...EventForm::schemaRules(),
        ], [], ['title' => 'título', 'date' => 'fecha', 'form_schema.*.label' => 'pregunta']);

        if (! empty($data['banner_media_id']) && ! app(CloudinaryService::class)->belongsToFolder(Media::find($data['banner_media_id'])->public_id, 'eventos')) {
            throw ValidationException::withMessages(['banner_media_id' => 'Archivo no válido.']);
        }

        $data['form_schema'] = EventForm::normalize($data['form_schema'] ?? []);

        return $data;
    }

    public static function answerText(mixed $value): string
    {
        return match (true) {
            is_bool($value) => $value ? 'Sí' : 'No',
            $value === null => '',
            default => (string) $value,
        };
    }
}
