<?php

namespace App\Http\Controllers;

use App\Models\AuthorizedPickup;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\StudentAttendance;
use App\Models\User;
use App\Support\PeruCalendar;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Asistencia diaria de un salón: llegada, estado y quién recoge al niño.
 */
class StudentAttendanceController extends Controller
{
    public function show(Request $request, Classroom $classroom): Response
    {
        Gate::authorize('takeAttendance', $classroom);

        $date = $request->validate(['fecha' => ['nullable', 'date', 'before_or_equal:today']])['fecha'] ?? today()->toDateString();

        $enrollments = $this->activeEnrollments($classroom);
        $records = StudentAttendance::query()
            ->where('classroom_id', $classroom->id)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('enrollment_id');

        $classroom->load('level');

        return Inertia::render('attendance/classroom', [
            'classroom' => [
                'id' => $classroom->id,
                'name' => $classroom->name,
                'level' => $classroom->level->name,
                'color' => $classroom->color,
                'mascot' => $classroom->mascot,
            ],
            'date' => $date,
            'isBusinessDay' => PeruCalendar::isBusinessDay(CarbonImmutable::parse($date)),
            'startTime' => config('school.student_start_time'),
            'students' => $enrollments->map(function (Enrollment $enrollment) use ($records) {
                $record = $records->get($enrollment->id);

                return [
                    'enrollment_id' => $enrollment->id,
                    'student_id' => $enrollment->student_id,
                    'name' => $enrollment->student->fullName(),
                    'allergies' => $enrollment->student->allergies,
                    'photo' => $enrollment->student->photo?->url('f_auto,q_auto,w_160,h_160,c_fill,g_face'),
                    'pickups' => $enrollment->student->guardians
                        ->filter(fn (User $guardian) => $guardian->pivot->can_pick_up)
                        ->map(fn (User $guardian) => "{$guardian->name} ({$guardian->pivot->relationship})")
                        ->concat($enrollment->student->authorizedPickups->map(fn (AuthorizedPickup $pickup) => $pickup->label()))
                        ->values(),
                    'record' => $record ? [
                        'status' => $record->status,
                        'arrived_at' => $record->arrived_at ? substr($record->arrived_at, 0, 5) : null,
                        'left_at' => $record->left_at ? substr($record->left_at, 0, 5) : null,
                        'picked_up_by' => $record->picked_up_by,
                        'notes' => $record->notes,
                    ] : null,
                ];
            }),
        ]);
    }

    /**
     * Guarda la asistencia de todo el salón de una vez (se puede volver a guardar para corregir).
     */
    public function store(Request $request, Classroom $classroom): RedirectResponse
    {
        Gate::authorize('takeAttendance', $classroom);

        $data = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'entries' => ['required', 'array'],
            'entries.*.enrollment_id' => ['required', 'integer', Rule::in($this->activeEnrollments($classroom)->pluck('id'))],
            'entries.*.status' => ['required', Rule::in(StudentAttendance::STATUSES)],
            'entries.*.arrived_at' => ['nullable', 'date_format:H:i'],
            'entries.*.left_at' => ['nullable', 'date_format:H:i'],
            'entries.*.picked_up_by' => ['nullable', 'string', 'max:120'],
            'entries.*.notes' => ['nullable', 'string', 'max:255'],
        ], [], ['entries.*.status' => 'estado']);

        DB::transaction(function () use ($data, $classroom, $request) {
            foreach ($data['entries'] as $entry) {
                $absent = in_array($entry['status'], ['falta', 'justificada'], true);

                $record = StudentAttendance::query()
                    ->where('enrollment_id', $entry['enrollment_id'])
                    ->whereDate('date', $data['date'])
                    ->first() ?? new StudentAttendance(['enrollment_id' => $entry['enrollment_id'], 'date' => $data['date']]);

                $record->fill([
                    'classroom_id' => $classroom->id,
                    'status' => $entry['status'],
                    'arrived_at' => $absent ? null : ($entry['arrived_at'] ?? null),
                    'left_at' => $absent ? null : ($entry['left_at'] ?? null),
                    'picked_up_by' => $absent ? null : ($entry['picked_up_by'] ?? null),
                    'notes' => $entry['notes'] ?? null,
                    'recorded_by' => $request->user()->id,
                ])->save();
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Asistencia guardada.']);

        return to_route('attendance.classroom', ['classroom' => $classroom, 'fecha' => $data['date']]);
    }

    /**
     * Reporte mensual del salón: alumnos × días.
     */
    public function report(Request $request, Classroom $classroom): Response
    {
        Gate::authorize('takeAttendance', $classroom);

        $month = $request->validate(['mes' => ['nullable', 'date_format:Y-m']])['mes'] ?? today()->format('Y-m');
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);
        $days = [];

        for ($day = $start; $day->month === $start->month; $day = $day->addDay()) {
            if (PeruCalendar::isBusinessDay($day)) {
                $days[] = $day->toDateString();
            }
        }

        $records = StudentAttendance::query()
            ->where('classroom_id', $classroom->id)
            ->whereBetween('date', [$start->toDateString(), $start->endOfMonth()->toDateString()])
            ->get()
            ->groupBy('enrollment_id');

        return Inertia::render('attendance/report', [
            'classroom' => ['id' => $classroom->id, 'name' => $classroom->name, 'mascot' => $classroom->mascot],
            'month' => $month,
            'days' => $days,
            'rows' => $this->activeEnrollments($classroom)->map(function (Enrollment $enrollment) use ($records) {
                $byDay = ($records->get($enrollment->id) ?? collect())
                    ->mapWithKeys(fn (StudentAttendance $record) => [$record->date->toDateString() => $record->status]);

                return [
                    'name' => $enrollment->student->fullName(),
                    'days' => $byDay,
                    'totals' => collect(StudentAttendance::STATUSES)->mapWithKeys(fn ($status) => [$status => $byDay->filter(fn ($s) => $s === $status)->count()]),
                ];
            }),
        ]);
    }

    /**
     * Calendario de asistencia de los hijos (vista del padre).
     */
    public function mine(Request $request): Response
    {
        $month = $request->validate(['mes' => ['nullable', 'date_format:Y-m']])['mes'] ?? today()->format('Y-m');
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);

        $children = $request->user()->children()
            ->with(['enrollments.attendances' => fn ($q) => $q->whereBetween('date', [$start->toDateString(), $start->endOfMonth()->toDateString()])])
            ->get();

        return Inertia::render('attendance/mine', [
            'month' => $month,
            'children' => $children->map(fn ($child) => [
                'id' => $child->id,
                'name' => $child->fullName(),
                'records' => $child->enrollments->flatMap->attendances
                    ->sortBy('date')
                    ->map(fn (StudentAttendance $record) => [
                        'date' => $record->date->toDateString(),
                        'status' => $record->status,
                        'arrived_at' => $record->arrived_at ? substr($record->arrived_at, 0, 5) : null,
                        'left_at' => $record->left_at ? substr($record->left_at, 0, 5) : null,
                        'picked_up_by' => $record->picked_up_by,
                        'notes' => $record->notes,
                    ])
                    ->values(),
            ]),
        ]);
    }

    /**
     * @return Collection<int, Enrollment>
     */
    private function activeEnrollments(Classroom $classroom)
    {
        return $classroom->enrollments()
            ->where('status', 'active')
            ->with(['student.guardians', 'student.authorizedPickups', 'student.photo'])
            ->get()
            ->sortBy(fn (Enrollment $enrollment) => $enrollment->student->last_name.' '.$enrollment->student->first_name)
            ->values();
    }
}
