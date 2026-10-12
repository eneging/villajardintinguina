<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ClassroomStaffRole;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Level;
use App\Models\SchoolYear;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Salones del año activo y su personal (maestra titular, auxiliar, practicantes).
 */
class ClassroomController extends Controller
{
    public function create(): Response
    {
        return $this->form();
    }

    public function store(Request $request): RedirectResponse
    {
        $year = SchoolYear::current();
        abort_unless($year, 422, 'Primero activa un año escolar.');

        $data = $this->validated($request);

        $classroom = DB::transaction(function () use ($data, $year) {
            $classroom = $year->classrooms()->create([
                ...$data['classroom'],
                'slug' => $this->uniqueSlug($year, $data['classroom']['name']),
            ]);
            $this->syncStaff($classroom, $data['staff']);

            return $classroom;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Salón creado.']);

        return to_route('classrooms.show', $classroom);
    }

    public function edit(Classroom $classroom): Response
    {
        return $this->form($classroom);
    }

    public function update(Request $request, Classroom $classroom): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($classroom, $data) {
            $classroom->update($data['classroom']);
            $this->syncStaff($classroom, $data['staff']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Salón actualizado.']);

        return to_route('classrooms.show', $classroom);
    }

    private function form(?Classroom $classroom = null): Response
    {
        $classroom?->load('staff');

        return Inertia::render('admin/classrooms/form', [
            'classroom' => $classroom ? [
                'id' => $classroom->id,
                'name' => $classroom->name,
                'level_id' => $classroom->level_id,
                'shift' => $classroom->shift,
                'capacity' => $classroom->capacity,
                'color' => $classroom->color,
                'mascot' => $classroom->mascot,
                'description' => $classroom->description,
                'staff' => $classroom->staff->map(fn (User $member) => [
                    'user_id' => $member->id,
                    'role' => $member->pivot->role,
                ])->values(),
            ] : null,
            'levels' => Level::orderBy('position')->get()->map(fn (Level $level) => ['value' => $level->id, 'label' => $level->name]),
            'staffOptions' => User::query()
                ->whereHas('roleAssignments', fn ($q) => $q->whereIn('role', [Role::Teacher->value, Role::Intern->value]))
                ->with('roleAssignments')
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'value' => $user->id,
                    'label' => $user->name.($user->hasRole(Role::Intern) && ! $user->hasRole(Role::Teacher) ? ' (practicante)' : ''),
                ]),
        ]);
    }

    /**
     * @return array{classroom: array<string, mixed>, staff: list<array{user_id: int, role: string}>}
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'level_id' => ['required', 'integer', 'exists:levels,id'],
            'shift' => ['required', 'in:mañana,tarde,completo'],
            'capacity' => ['required', 'integer', 'min:1', 'max:60'],
            'color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'mascot' => ['nullable', 'string', 'max:8'],
            'description' => ['nullable', 'string', 'max:1000'],
            'staff' => ['array', 'max:10'],
            'staff.*.user_id' => ['required', 'distinct', Rule::exists('role_user', 'user_id')->whereIn('role', [Role::Teacher->value, Role::Intern->value])],
            'staff.*.role' => ['required', Rule::enum(ClassroomStaffRole::class)],
        ], [], [
            'name' => 'nombre',
            'level_id' => 'nivel',
            'capacity' => 'capacidad',
            'staff.*.user_id' => 'persona',
        ]);

        return [
            'classroom' => collect($data)->except('staff')->all(),
            'staff' => $data['staff'] ?? [],
        ];
    }

    /**
     * @param  list<array{user_id: int, role: string}>  $staff
     */
    private function syncStaff(Classroom $classroom, array $staff): void
    {
        $classroom->staff()->sync(collect($staff)->mapWithKeys(fn ($member) => [$member['user_id'] => ['role' => $member['role']]])->all());
    }

    private function uniqueSlug(SchoolYear $year, string $name): string
    {
        $base = str($name)->slug()->value() ?: 'salon';
        $slug = $base;

        for ($i = 2; $year->classrooms()->where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
