<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Conversation;
use App\Models\ConversationRead;
use App\Models\Media;
use App\Models\Message;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\Notifier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Mensajes padre–maestra dentro de la plataforma: un hilo por alumno, sin
 * que la maestra tenga que dar su número personal.
 */
class MessageController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('messages/index', [
            'threads' => $this->threads($request->user()),
        ]);
    }

    public function show(Request $request, Student $student): Response
    {
        $user = $request->user();
        abort_unless(Conversation::canAccess($user, $student), 403);

        $conversation = Conversation::firstOrCreate(['student_id' => $student->id]);
        $conversation->markReadBy($user);
        $student->load(['guardians', 'currentEnrollment.classroom.staff', 'photo']);
        $classroom = $student->currentEnrollment?->classroom;

        return Inertia::render('messages/show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->fullName(),
                'photo' => $student->photo?->toClient(),
                'classroom' => $classroom?->only(['id', 'name', 'color', 'mascot']),
            ],
            'participants' => [
                'family' => $student->guardians->map(fn (User $guardian) => "{$guardian->name} ({$guardian->pivot->relationship})")->values(),
                'staff' => $classroom?->staff->map(fn (User $member) => $member->name)->values() ?? [],
            ],
            'messages' => $conversation->messages()->reorder()->with(['user', 'media'])->latest('id')->limit(200)->get()->reverse()->values()
                ->map(fn (Message $message) => [
                    'id' => $message->id,
                    'body' => $message->body,
                    'mine' => $message->user_id === $user->id,
                    'author' => $message->user?->name ?? 'Usuario eliminado',
                    'from_family' => $message->user ? $student->guardians->contains('id', $message->user_id) : false,
                    'media' => $message->media?->toClient(),
                    'created_at' => $message->created_at->toIso8601String(),
                ]),
            'canUpload' => $classroom !== null && app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    public function store(Request $request, Student $student, Notifier $notifier): RedirectResponse
    {
        $user = $request->user();
        abort_unless(Conversation::canAccess($user, $student), 403);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
            'media_id' => ['nullable', 'integer', 'exists:media,id'],
        ], [], ['body' => 'mensaje']);

        $classroom = $student->currentEnrollment?->classroom;

        if (! empty($data['media_id'])) {
            $publicId = Media::find($data['media_id'])->public_id;
            $cloudinary = app(CloudinaryService::class);
            abort_unless(
                ($classroom && $cloudinary->belongsToFolder($publicId, "salones/{$classroom->id}"))
                    || $cloudinary->belongsToFolder($publicId, "alumnos/{$student->id}"),
                422,
            );
        }

        $conversation = Conversation::firstOrCreate(['student_id' => $student->id]);
        $previous = $conversation->last_message_at;
        $conversation->messages()->create([...$data, 'user_id' => $user->id]);
        $conversation->update(['last_message_at' => now()]);
        $conversation->markReadBy($user);

        $isFamily = $student->guardians()->whereKey($user->id)->exists();
        $recipients = $isFamily
            ? ($classroom?->staff()->get() ?? collect())
            : $student->guardians()->get();

        // Avisa solo a quien tenía el hilo al día: evita una notificación por cada mensaje seguido.
        $reads = ConversationRead::where('conversation_id', $conversation->id)->pluck('last_read_at', 'user_id');
        $recipients = $recipients->filter(fn (User $recipient) => ! $previous || ($reads[$recipient->id] ?? null)?->gte($previous));

        $notifier->send(
            $recipients,
            'message',
            $isFamily ? "Mensaje de {$user->name} ({$student->first_name})" : "Mensaje de {$user->name}",
            $data['body'],
            route('messages.show', $student, false),
            $user,
        );

        return back();
    }

    /**
     * Hilos que ve cada persona, con mensajes sin leer.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function threads(User $user): Collection
    {
        $yearId = SchoolYear::current()?->id;

        $students = Student::query()
            ->with(['currentEnrollment.classroom', 'photo'])
            ->when(! $user->isAdmin(), fn (Builder $q) => $q->where(fn (Builder $q) => $q
                ->whereHas('guardians', fn (Builder $g) => $g->whereKey($user->id))
                ->orWhereHas('enrollments', fn (Builder $e) => $e
                    ->where('school_year_id', $yearId)
                    ->where('status', 'active')
                    ->whereIn('classroom_id', Classroom::query()->whereHas('staff', fn (Builder $s) => $s->whereKey($user->id))->select('id')))))
            ->when($user->isAdmin(), fn (Builder $q) => $q->whereHas('conversation.messages'))
            ->get();

        $conversations = Conversation::query()
            ->whereIn('student_id', $students->pluck('id'))
            ->with(['messages' => fn ($q) => $q->latest('id')->limit(1)->with('user')])
            ->get()
            ->keyBy('student_id');
        $reads = ConversationRead::where('user_id', $user->id)->pluck('last_read_at', 'conversation_id');

        return $students->map(function (Student $student) use ($conversations, $reads, $user) {
            $conversation = $conversations->get($student->id);
            $last = $conversation?->messages->first();
            $readAt = $conversation ? ($reads[$conversation->id] ?? null) : null;

            return [
                'student_id' => $student->id,
                'name' => $student->fullName(),
                'photo' => $student->photo?->toClient(),
                'classroom' => $student->currentEnrollment?->classroom?->only(['name', 'mascot', 'color']),
                'last_message' => $last ? ['body' => $last->body, 'author' => $last->user?->name, 'created_at' => $last->created_at->toIso8601String()] : null,
                'unread' => $last && $last->user_id !== $user->id && (! $readAt || $last->created_at->gt($readAt)),
                'sort' => $conversation?->last_message_at?->timestamp ?? 0,
            ];
        })->sortByDesc('sort')->values();
    }
}
