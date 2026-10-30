<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\DailyLog;
use App\Models\Enrollment;
use App\Models\Media;
use App\Models\Student;
use App\Services\CloudinaryService;
use App\Services\Notifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Cuaderno diario: la maestra registra el día de cada niño y lo envía a la familia.
 */
class DailyLogController extends Controller
{
    public function classroom(Request $request, Classroom $classroom): Response
    {
        Gate::authorize('takeAttendance', $classroom);

        $date = $request->validate(['fecha' => ['nullable', 'date', 'before_or_equal:today']])['fecha'] ?? today()->toDateString();
        $logs = DailyLog::query()->with('photo')->where('classroom_id', $classroom->id)->whereDate('date', $date)->get()->keyBy('student_id');

        $students = $classroom->enrollments()
            ->where('status', 'active')
            ->with(['student.photo'])
            ->get()
            ->map(fn (Enrollment $enrollment) => $enrollment->student)
            ->sortBy(fn (Student $student) => $student->first_name)
            ->values();

        return Inertia::render('daily-logs/classroom', [
            'classroom' => $classroom->only(['id', 'name', 'color', 'mascot']),
            'date' => $date,
            'students' => $students->map(fn (Student $student) => [
                'id' => $student->id,
                'name' => $student->fullName(),
                'photo' => $student->photo?->url('f_auto,q_auto,w_160,h_160,c_fill,g_face'),
                'allergies' => $student->allergies,
                'log' => $logs->get($student->id)?->toClient(),
            ]),
            'options' => DailyLog::options(),
            'canUpload' => $request->user()->can('uploadMedia', $classroom) && app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    public function save(Request $request, Classroom $classroom, Student $student): RedirectResponse
    {
        Gate::authorize('takeAttendance', $classroom);
        abort_unless($classroom->enrollments()->where('status', 'active')->where('student_id', $student->id)->exists(), 404);

        $data = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'meals' => ['array', 'max:6'],
            'meals.*.moment' => ['required', Rule::in(array_keys(DailyLog::MOMENTS))],
            'meals.*.amount' => ['required', Rule::in(array_keys(DailyLog::AMOUNTS))],
            'meals.*.note' => ['nullable', 'string', 'max:120'],
            'naps' => ['array', 'max:4'],
            'naps.*.from' => ['required', 'date_format:H:i'],
            'naps.*.to' => ['nullable', 'date_format:H:i', 'after:naps.*.from'],
            'diapers' => ['array', 'max:12'],
            'diapers.*.time' => ['required', 'date_format:H:i'],
            'diapers.*.type' => ['required', Rule::in(array_keys(DailyLog::DIAPERS))],
            'mood' => ['nullable', Rule::in(array_keys(DailyLog::MOODS))],
            'note' => ['nullable', 'string', 'max:1000'],
            'needs' => ['nullable', 'string', 'max:255'],
            'photo_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'send' => ['boolean'],
        ], [], ['naps.*.to' => 'fin de la siesta', 'meals.*.amount' => 'cuánto comió']);

        if (! empty($data['photo_media_id']) && ! app(CloudinaryService::class)->belongsToFolder(Media::find($data['photo_media_id'])->public_id, "salones/{$classroom->id}")) {
            throw ValidationException::withMessages(['photo_media_id' => 'La foto no pertenece a este salón.']);
        }

        $log = DailyLog::query()->where('student_id', $student->id)->whereDate('date', $data['date'])->first()
            ?? new DailyLog(['student_id' => $student->id, 'date' => $data['date']]);

        $firstSend = ($data['send'] ?? false) && ! $log->sent_at;

        $log->fill([
            'classroom_id' => $classroom->id,
            'meals' => array_values($data['meals'] ?? []),
            'naps' => array_values($data['naps'] ?? []),
            'diapers' => array_values($data['diapers'] ?? []),
            'mood' => $data['mood'] ?? null,
            'note' => $data['note'] ?? null,
            'needs' => $data['needs'] ?? null,
            'photo_media_id' => $data['photo_media_id'] ?? null,
            'recorded_by' => $request->user()->id,
            'sent_at' => ($data['send'] ?? false) ? ($log->sent_at ?? now()) : $log->sent_at,
        ])->save();

        if ($firstSend) {
            app(Notifier::class)->send(
                $student->guardians()->get(),
                'daily',
                "Cuaderno de {$student->first_name}",
                $log->note ?? 'La maestra registró cómo le fue hoy.',
                route('daily-logs.mine', ['fecha' => $log->date->toDateString()], false),
                $request->user(),
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => ($data['send'] ?? false) ? "Cuaderno de {$student->first_name} enviado a la familia." : 'Cuaderno guardado.']);

        return back();
    }

    /** Padres: el cuaderno de sus hijos (solo lo enviado). */
    public function mine(Request $request): Response
    {
        $date = $request->validate(['fecha' => ['nullable', 'date', 'before_or_equal:today']])['fecha'] ?? null;
        $children = $request->user()->children()->with('photo')->orderBy('first_name')->get();

        $logs = DailyLog::query()
            ->with(['photo', 'recorder', 'classroom'])
            ->whereIn('student_id', $children->pluck('id'))
            ->whereNotNull('sent_at')
            ->when($date, fn ($q) => $q->whereDate('date', $date), fn ($q) => $q->whereDate('date', '>=', today()->subDays(13)))
            ->orderByDesc('date')
            ->get();

        return Inertia::render('daily-logs/mine', [
            'date' => $date,
            'children' => $children->map(fn (Student $student) => [
                'id' => $student->id,
                'name' => $student->fullName(),
                'first_name' => $student->first_name,
            ]),
            'logs' => $logs->map(fn (DailyLog $log) => [
                ...$log->toClient(),
                'classroom' => $log->classroom->only(['name', 'color', 'mascot']),
            ]),
            'options' => DailyLog::options(),
        ]);
    }
}
