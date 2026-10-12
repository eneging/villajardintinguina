<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InductionScope;
use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use App\Models\InductionAssignment;
use App\Models\Level;
use App\Models\SchoolYear;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Configuración del colegio: años escolares, niveles y categorías de gastos.
 */
class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/settings/index', [
            'years' => SchoolYear::query()
                ->withCount(['classrooms', 'enrollments'])
                ->orderByDesc('year')
                ->get()
                ->map(fn (SchoolYear $year) => [
                    'id' => $year->id,
                    'year' => $year->year,
                    'starts_on' => $year->starts_on->toDateString(),
                    'ends_on' => $year->ends_on->toDateString(),
                    'is_active' => $year->is_active,
                    'classrooms_count' => $year->classrooms_count,
                    'enrollments_count' => $year->enrollments_count,
                ]),
            'levels' => Level::query()->withCount('classrooms')->orderBy('position')->get()->map(fn (Level $level) => [
                'id' => $level->id,
                'name' => $level->name,
                'min_age_months' => $level->min_age_months,
                'max_age_months' => $level->max_age_months,
                'position' => $level->position,
                'classrooms_count' => $level->classrooms_count,
            ]),
            'categories' => ExpenseCategory::query()->withCount('expenses')->orderBy('name')->get()->map(fn (ExpenseCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'expenses_count' => $category->expenses_count,
            ]),
        ]);
    }

    /**
     * Crea el año escolar; opcionalmente copia los salones del año activo
     * (con su personal, información e inducciones por salón).
     */
    public function storeYear(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2020', 'max:2100', 'unique:school_years,year'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after:starts_on'],
            'copy_classrooms' => ['boolean'],
            'copy_staff' => ['boolean'],
        ], [], ['year' => 'año', 'starts_on' => 'inicio', 'ends_on' => 'fin']);

        $source = SchoolYear::current();

        $copied = DB::transaction(function () use ($data, $source) {
            $year = SchoolYear::create([
                'year' => $data['year'],
                'starts_on' => $data['starts_on'],
                'ends_on' => $data['ends_on'],
                'is_active' => $source === null,
            ]);

            if (! ($data['copy_classrooms'] ?? false) || ! $source) {
                return 0;
            }

            $source->load('classrooms.staff');

            foreach ($source->classrooms as $classroom) {
                $copy = $year->classrooms()->create($classroom->only([
                    'level_id', 'name', 'slug', 'shift', 'capacity', 'color', 'mascot', 'description', 'cover_media_id', 'schedule', 'supplies',
                ]));

                if ($data['copy_staff'] ?? false) {
                    $copy->staff()->sync($classroom->staff->mapWithKeys(fn ($member) => [$member->id => ['role' => $member->pivot->role]])->all());
                }

                // Las lecciones de inducción del salón también se asignan al nuevo salón.
                InductionAssignment::query()
                    ->where('scope', InductionScope::Classroom)
                    ->where('scope_id', $classroom->id)
                    ->get()
                    ->each(fn (InductionAssignment $assignment) => InductionAssignment::create([
                        'induction_lesson_id' => $assignment->induction_lesson_id,
                        'scope' => InductionScope::Classroom,
                        'scope_id' => $copy->id,
                    ]));
            }

            return $source->classrooms->count();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => $copied
            ? "Año {$data['year']} creado con {$copied} salones copiados."
            : "Año {$data['year']} creado."]);

        return back();
    }

    public function updateYear(Request $request, SchoolYear $year): RedirectResponse
    {
        $year->update($request->validate([
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after:starts_on'],
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Fechas actualizadas.']);

        return back();
    }

    /** Solo un año está activo: el que usan matrículas, cuotas y salones. */
    public function activateYear(SchoolYear $year): RedirectResponse
    {
        DB::transaction(function () use ($year) {
            SchoolYear::query()->whereKeyNot($year->id)->update(['is_active' => false]);
            $year->update(['is_active' => true]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => "El año {$year->year} ahora es el año activo."]);

        return back();
    }

    public function storeLevel(Request $request): RedirectResponse
    {
        Level::create($this->levelData($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Nivel creado.']);

        return back();
    }

    public function updateLevel(Request $request, Level $level): RedirectResponse
    {
        $level->update($this->levelData($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Nivel actualizado.']);

        return back();
    }

    public function destroyLevel(Level $level): RedirectResponse
    {
        if ($level->classrooms()->exists()) {
            throw ValidationException::withMessages(['level' => 'No se puede eliminar un nivel que tiene salones.']);
        }

        $level->delete();

        return back();
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        ExpenseCategory::create($request->validate([
            'name' => ['required', 'string', 'max:60', 'unique:expense_categories,name'],
        ], [], ['name' => 'categoría']));

        return back();
    }

    public function updateCategory(Request $request, ExpenseCategory $category): RedirectResponse
    {
        $category->update($request->validate([
            'name' => ['required', 'string', 'max:60', Rule::unique('expense_categories', 'name')->ignore($category)],
        ], [], ['name' => 'categoría']));

        return back();
    }

    public function destroyCategory(ExpenseCategory $category): RedirectResponse
    {
        if ($category->expenses()->exists()) {
            throw ValidationException::withMessages(['category' => 'La categoría tiene gastos registrados; cámbiale el nombre en lugar de eliminarla.']);
        }

        $category->delete();

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function levelData(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'min_age_months' => ['required', 'integer', 'min:0', 'max:120'],
            'max_age_months' => ['required', 'integer', 'gte:min_age_months', 'max:120'],
            'position' => ['nullable', 'integer', 'min:0', 'max:99'],
        ], [], ['name' => 'nombre', 'min_age_months' => 'edad mínima', 'max_age_months' => 'edad máxima']);

        return [...$data, 'position' => $data['position'] ?? 0];
    }
}
