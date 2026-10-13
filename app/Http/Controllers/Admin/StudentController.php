<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\User;
use App\Support\CsvExport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Fichas de alumnos con sus apoderados y su matrícula del año activo.
 */
class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'classroom' => ['nullable', 'integer'],
        ]);
        $year = SchoolYear::current();

        $students = Student::query()
            ->with(['guardians', 'currentEnrollment.classroom'])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($q) => $q
                ->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('dni', 'like', "%{$search}%")))
            ->when($filters['classroom'] ?? null, fn ($query, $classroomId) => $query->whereHas(
                'enrollments',
                fn ($q) => $q->where('classroom_id', $classroomId)->where('school_year_id', $year?->id),
            ))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/students/index', [
            'students' => $students->through(fn (Student $student) => [
                'id' => $student->id,
                'name' => $student->fullName(),
                'dni' => $student->dni,
                'classroom' => $student->currentEnrollment?->classroom->name,
                'guardians' => $student->guardians->map(fn (User $guardian) => $guardian->name)->values(),
            ]),
            'filters' => [
                'search' => $filters['search'] ?? '',
                'classroom' => isset($filters['classroom']) ? (string) $filters['classroom'] : '',
            ],
            'classrooms' => $this->classroomOptions(),
            'year' => $year?->year,
        ]);
    }

    public function export(): StreamedResponse
    {
        $year = SchoolYear::current();
        $students = Student::query()
            ->with(['guardians', 'authorizedPickups', 'currentEnrollment.classroom'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return CsvExport::download(
            'alumnos-villajardin-'.($year?->year ?? today()->year).'.csv',
            ['Apellidos', 'Nombres', 'DNI', 'Fecha de nacimiento', 'Edad', 'Salón', 'Mensualidad', 'Apoderados', 'Personas autorizadas', 'Alergias', 'Autoriza imagen'],
            $students->map(fn (Student $student) => [
                $student->last_name,
                $student->first_name,
                $student->dni,
                $student->birth_date?->format('d/m/Y'),
                $student->age(),
                $student->currentEnrollment?->classroom->name ?? 'Sin matrícula',
                $student->currentEnrollment ? (float) $student->currentEnrollment->monthly_fee : null,
                $student->guardians->map(fn (User $guardian) => "{$guardian->name} ({$guardian->pivot->relationship}) {$guardian->phone}")->implode(' | '),
                $student->authorizedPickups->map(fn ($pickup) => $pickup->label())->implode(' | '),
                $student->allergies,
                $student->image_consent,
            ]),
        );
    }

    public function create(): Response
    {
        return $this->form();
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data) {
            $student = Student::create($data['student']);
            $this->syncRelations($student, $data);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Alumno registrado.']);

        return to_route('admin.students.index');
    }

    public function edit(Student $student): Response
    {
        return $this->form($student);
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $data = $this->validated($request, $student);

        DB::transaction(function () use ($student, $data) {
            $student->update($data['student']);
            $this->syncRelations($student, $data);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ficha actualizada.']);

        return to_route('admin.students.index');
    }

    private function form(?Student $student = null): Response
    {
        $student?->load(['guardians', 'currentEnrollment']);
        $enrollment = $student?->currentEnrollment;

        return Inertia::render('admin/students/form', [
            'student' => $student ? [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'dni' => $student->dni,
                'birth_date' => $student->birth_date?->toDateString(),
                'sex' => $student->sex,
                'allergies' => $student->allergies,
                'medical_notes' => $student->medical_notes,
                'image_consent' => $student->image_consent,
                'guardians' => $student->guardians->map(fn (User $guardian) => [
                    'user_id' => $guardian->id,
                    'relationship' => $guardian->pivot->relationship,
                    'is_billing_contact' => (bool) $guardian->pivot->is_billing_contact,
                    'can_pick_up' => (bool) $guardian->pivot->can_pick_up,
                ])->values(),
                'enrollment' => $enrollment ? [
                    'classroom_id' => $enrollment->classroom_id,
                    'monthly_fee' => $enrollment->monthly_fee,
                    'discount_pct' => $enrollment->discount_pct,
                    'status' => $enrollment->status,
                ] : null,
            ] : null,
            'parents' => User::query()
                ->whereHas('roleAssignments', fn ($q) => $q->where('role', Role::Parent))
                ->orderBy('name')
                ->get(['id', 'name', 'dni', 'phone'])
                ->map(fn (User $user) => [
                    'value' => $user->id,
                    'label' => $user->name.($user->dni ? " · DNI {$user->dni}" : ''),
                ]),
            'classrooms' => $this->classroomOptions(),
            'year' => SchoolYear::current()?->year,
        ]);
    }

    /**
     * @return array{student: array<string, mixed>, guardians: list<array<string, mixed>>, enrollment: array<string, mixed>|null}
     */
    private function validated(Request $request, ?Student $student = null): array
    {
        $yearId = SchoolYear::current()?->id;

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'dni' => ['nullable', 'digits:8', Rule::unique('students', 'dni')->ignore($student)],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'sex' => ['nullable', 'in:F,M'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'medical_notes' => ['nullable', 'string', 'max:2000'],
            'image_consent' => ['boolean'],
            'guardians' => ['array', 'max:6'],
            'guardians.*.user_id' => ['required', 'distinct', Rule::exists('role_user', 'user_id')->where('role', Role::Parent->value)],
            'guardians.*.relationship' => ['required', 'string', 'max:30'],
            'guardians.*.is_billing_contact' => ['boolean'],
            'guardians.*.can_pick_up' => ['boolean'],
            'enrollment' => ['nullable', 'array'],
            'enrollment.classroom_id' => ['required_with:enrollment', 'integer', Rule::exists('classrooms', 'id')->where('school_year_id', $yearId)],
            'enrollment.monthly_fee' => ['required_with:enrollment', 'numeric', 'min:0', 'max:99999'],
            'enrollment.discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'enrollment.status' => ['required_with:enrollment', 'in:active,withdrawn'],
        ], [], [
            'first_name' => 'nombres',
            'last_name' => 'apellidos',
            'birth_date' => 'fecha de nacimiento',
            'guardians.*.user_id' => 'apoderado',
            'guardians.*.relationship' => 'parentesco',
            'enrollment.classroom_id' => 'salón',
            'enrollment.monthly_fee' => 'mensualidad',
        ]);

        return [
            'student' => collect($data)->only(['first_name', 'last_name', 'dni', 'birth_date', 'sex', 'allergies', 'medical_notes', 'image_consent'])->all(),
            'guardians' => $data['guardians'] ?? [],
            'enrollment' => $data['enrollment'] ?? null,
        ];
    }

    /**
     * @param  array{guardians: list<array<string, mixed>>, enrollment: array<string, mixed>|null}  $data
     */
    private function syncRelations(Student $student, array $data): void
    {
        $student->guardians()->sync(collect($data['guardians'])->mapWithKeys(fn ($guardian) => [
            $guardian['user_id'] => [
                'relationship' => $guardian['relationship'],
                'is_billing_contact' => $guardian['is_billing_contact'] ?? false,
                'can_pick_up' => $guardian['can_pick_up'] ?? true,
            ],
        ])->all());

        $year = SchoolYear::current();

        if ($data['enrollment'] && $year) {
            $student->enrollments()->updateOrCreate(
                ['school_year_id' => $year->id],
                [
                    'classroom_id' => $data['enrollment']['classroom_id'],
                    'monthly_fee' => $data['enrollment']['monthly_fee'],
                    'discount_pct' => $data['enrollment']['discount_pct'] ?? 0,
                    'status' => $data['enrollment']['status'],
                ],
            );
        }
    }

    /**
     * @return Collection<int, array{value: int, label: string}>
     */
    private function classroomOptions()
    {
        return Classroom::query()
            ->where('school_year_id', SchoolYear::current()?->id)
            ->with('level')
            ->orderBy('level_id')
            ->get()
            ->map(fn (Classroom $classroom) => [
                'value' => $classroom->id,
                'label' => "{$classroom->name} ({$classroom->level->name})",
            ]);
    }
}
