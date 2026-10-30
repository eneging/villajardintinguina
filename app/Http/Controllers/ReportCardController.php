<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\GradingPeriod;
use App\Models\ReportCard;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\User;
use App\Services\Notifier;
use App\Support\Competencies;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Libretas de notas por competencias (CNEB): la maestra califica, la
 * administradora publica el periodo y las familias ven e imprimen la libreta.
 */
class ReportCardController extends Controller
{
    public function classroom(Request $request, Classroom $classroom): Response
    {
        Gate::authorize('uploadMedia', $classroom);

        $periods = GradingPeriod::query()->where('school_year_id', $classroom->school_year_id)->orderBy('starts_on')->get();
        $periodId = (int) ($request->validate(['periodo' => ['nullable', 'integer']])['periodo'] ?? 0);
        $period = $periods->firstWhere('id', $periodId)
            ?? $periods->first(fn (GradingPeriod $p) => today()->between($p->starts_on, $p->ends_on))
            ?? $periods->last();

        $cards = $period
            ? ReportCard::query()->where('grading_period_id', $period->id)->get()->keyBy('student_id')
            : collect();

        $students = $classroom->enrollments()->where('status', 'active')->with('student')->get()
            ->map(fn (Enrollment $enrollment) => $enrollment->student)
            ->sortBy(fn (Student $student) => $student->last_name.' '.$student->first_name)
            ->values();

        return Inertia::render('report-cards/classroom', [
            'classroom' => $classroom->only(['id', 'name', 'color', 'mascot']),
            'periods' => $periods->map(fn (GradingPeriod $p) => $p->toClient()),
            'period' => $period?->toClient(),
            'students' => $students->map(fn (Student $student) => [
                'id' => $student->id,
                'name' => $student->fullName(),
                'grades' => (object) ($cards->get($student->id)?->grades ?? []),
                'comment' => $cards->get($student->id)?->comment,
                'graded' => $cards->get($student->id)?->gradedCount() ?? 0,
            ]),
            'catalog' => Competencies::forClient(),
            'total' => count(Competencies::keys()),
        ]);
    }

    public function save(Request $request, Classroom $classroom, GradingPeriod $period, Student $student): RedirectResponse
    {
        Gate::authorize('uploadMedia', $classroom);
        abort_unless($period->school_year_id === $classroom->school_year_id, 404);
        abort_unless($classroom->enrollments()->where('status', 'active')->where('student_id', $student->id)->exists(), 404);

        $keys = Competencies::keys();
        $data = $request->validate([
            'grades' => ['array'],
            'grades.*' => ['array'],
            'grades.*.grade' => ['nullable', Rule::in(array_keys(Competencies::GRADES))],
            'grades.*.conclusion' => ['nullable', 'string', 'max:500'],
            'comment' => ['nullable', 'string', 'max:1500'],
        ]);

        $grades = collect($data['grades'] ?? [])
            ->only($keys)
            ->map(fn ($entry) => ['grade' => $entry['grade'] ?? null, 'conclusion' => $entry['conclusion'] ?? null])
            ->filter(fn ($entry) => $entry['grade'] || $entry['conclusion'])
            ->all();

        ReportCard::updateOrCreate(
            ['grading_period_id' => $period->id, 'student_id' => $student->id],
            ['classroom_id' => $classroom->id, 'grades' => $grades, 'comment' => $data['comment'] ?? null, 'updated_by' => $request->user()->id],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => "Libreta de {$student->first_name} guardada."]);

        return back();
    }

    /** Libreta imprimible (administradora, personal del salón o apoderado si el periodo está publicado). */
    public function show(Request $request, Student $student, GradingPeriod $period): Response
    {
        $user = $request->user();
        $card = ReportCard::query()->with(['classroom.level', 'classroom.staff', 'student'])
            ->where('grading_period_id', $period->id)->where('student_id', $student->id)->firstOrFail();

        $isGuardian = $student->guardians()->whereKey($user->id)->exists();
        abort_unless(
            $user->isAdmin() || $card->classroom->hasStaffMember($user) || ($isGuardian && $period->published_at),
            403,
        );

        $attendance = StudentAttendance::query()
            ->whereHas('enrollment', fn ($q) => $q->where('student_id', $student->id))
            ->whereBetween('date', [$period->starts_on->toDateString(), $period->ends_on->toDateString()])
            ->get()
            ->countBy('status');

        return Inertia::render('report-cards/show', [
            'school' => ['name' => config('school.name'), 'legal_name' => config('school.legal_name'), 'address' => config('school.address')],
            'period' => [...$period->toClient(), 'year' => $period->schoolYear->year],
            'student' => ['name' => $student->fullName(), 'dni' => $student->dni],
            'classroom' => [
                'name' => $card->classroom->name,
                'level' => $card->classroom->level->name,
                'teacher' => $card->classroom->staff->firstWhere('pivot.role', 'titular')?->name,
            ],
            'grades' => (object) ($card->grades ?? []),
            'comment' => $card->comment,
            'attendance' => $attendance,
            'catalog' => Competencies::forClient(),
        ]);
    }

    /** Padres: libretas publicadas de sus hijos. */
    public function mine(Request $request): Response
    {
        $children = $request->user()->children()->orderBy('first_name')->get();
        $cards = ReportCard::query()
            ->with('period')
            ->whereIn('student_id', $children->pluck('id'))
            ->whereHas('period', fn ($q) => $q->whereNotNull('published_at'))
            ->get()
            ->sortByDesc(fn (ReportCard $card) => $card->period->starts_on);

        return Inertia::render('report-cards/mine', [
            'children' => $children->map(fn (Student $student) => [
                'id' => $student->id,
                'name' => $student->fullName(),
                'cards' => $cards->where('student_id', $student->id)->values()->map(fn (ReportCard $card) => [
                    'period' => $card->period->toClient(),
                    'summary' => collect($card->grades ?? [])->countBy('grade')->except(['']),
                ]),
            ]),
        ]);
    }

    // ---- Administración de periodos (desde Configuración) ----

    public function storePeriod(Request $request): RedirectResponse
    {
        $year = SchoolYear::current();
        abort_unless($year, 422, 'No hay un año escolar activo.');

        GradingPeriod::create([
            ...$request->validate([
                'name' => ['required', 'string', 'max:60'],
                'starts_on' => ['required', 'date'],
                'ends_on' => ['required', 'date', 'after:starts_on'],
            ], [], ['name' => 'nombre', 'starts_on' => 'inicio', 'ends_on' => 'fin']),
            'school_year_id' => $year->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Periodo creado.']);

        return back();
    }

    public function publishPeriod(Request $request, GradingPeriod $period): RedirectResponse
    {
        $publish = $request->boolean('published');
        $wasPublished = $period->published_at !== null;
        $period->update(['published_at' => $publish ? ($period->published_at ?? now()) : null]);

        if ($publish && ! $wasPublished) {
            $parents = User::query()->whereHas('children', fn ($q) => $q->whereIn('students.id', $period->reportCards()->pluck('student_id')))->get();
            app(Notifier::class)->send($parents, 'report', "Libreta de notas: {$period->name}", 'Ya puedes ver la libreta de tu hijo.', route('report-cards.mine', absolute: false), $request->user());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $publish ? 'Libretas publicadas para las familias.' : 'Libretas ocultas para las familias.']);

        return back();
    }

    public function destroyPeriod(GradingPeriod $period): RedirectResponse
    {
        abort_if($period->reportCards()->exists(), 422, 'El periodo ya tiene libretas registradas.');
        $period->delete();

        return back();
    }
}
