<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Incident;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Services\Notifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Incidentes y enfermería: el personal registra, la familia recibe el aviso y confirma que lo leyó.
 */
class IncidentController extends Controller
{
    public function index(Request $request): Response
    {
        $classrooms = $this->classroomsFor($request);

        return Inertia::render('incidents/index', [
            'incidents' => Incident::query()
                ->with(['student', 'classroom', 'reporter', 'acknowledger'])
                ->whereIn('classroom_id', $classrooms->pluck('id'))
                ->latest('occurred_at')
                ->limit(100)
                ->get()
                ->map(fn (Incident $incident) => $incident->toClient()),
            'students' => $classrooms->flatMap(fn (Classroom $classroom) => $classroom->enrollments->map(fn ($enrollment) => [
                'value' => $enrollment->student->id,
                'label' => "{$enrollment->student->fullName()} ({$classroom->name})",
            ]))->sortBy('label')->values(),
            'types' => collect(Incident::TYPES)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
        ]);
    }

    public function store(Request $request, Notifier $notifier): RedirectResponse
    {
        $classrooms = $this->classroomsFor($request);
        $allowed = $classrooms->flatMap(fn (Classroom $classroom) => $classroom->enrollments->pluck('student_id'));

        $data = $request->validate([
            'student_id' => ['required', 'integer', Rule::in($allowed)],
            'occurred_at' => ['required', 'date', 'before_or_equal:now'],
            'type' => ['required', Rule::in(array_keys(Incident::TYPES))],
            'description' => ['required', 'string', 'max:1000'],
            'action_taken' => ['nullable', 'string', 'max:1000'],
            'medicine' => ['nullable', 'string', 'max:150'],
        ], [], ['student_id' => 'alumno', 'occurred_at' => 'hora', 'description' => 'qué pasó', 'action_taken' => 'qué se hizo']);

        $student = Student::findOrFail($data['student_id']);
        $incident = Incident::create([
            ...$data,
            'classroom_id' => $student->currentEnrollment?->classroom_id,
            'reported_by' => $request->user()->id,
        ]);

        $notifier->send(
            $student->guardians()->get(),
            'incident',
            "Aviso sobre {$student->first_name}: ".Incident::TYPES[$incident->type],
            $incident->description,
            route('students.show', $student, false),
            $request->user(),
        );
        $notifier->send($notifier->admins(), 'incident', "Incidente: {$student->fullName()}", $incident->description, route('incidents.index', absolute: false), $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Incidente registrado y familia avisada.']);

        return back();
    }

    /** El apoderado confirma que leyó el aviso. */
    public function acknowledge(Request $request, Incident $incident): RedirectResponse
    {
        abort_unless($incident->student->guardians()->whereKey($request->user()->id)->exists(), 403);

        if (! $incident->acknowledged_at) {
            $incident->update(['acknowledged_at' => now(), 'acknowledged_by' => $request->user()->id]);
        }

        return back();
    }

    /**
     * Salones del año activo con sus alumnos: todos para la administradora, los suyos para el personal.
     *
     * @return Collection<int, Classroom>
     */
    private function classroomsFor(Request $request)
    {
        $user = $request->user();

        return Classroom::query()
            ->where('school_year_id', SchoolYear::current()?->id)
            ->when(! $user->isAdmin(), fn ($q) => $q->whereHas('staff', fn ($s) => $s->whereKey($user->id)))
            ->with(['enrollments' => fn ($q) => $q->where('status', 'active')->with('student')])
            ->get();
    }
}
