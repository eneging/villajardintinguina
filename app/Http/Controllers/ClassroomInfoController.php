<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ClassroomActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Información práctica del salón para las familias: horario del día, lista
 * de útiles, menú semanal y calendario de actividades. La editan la
 * administradora y las maestras del salón.
 */
class ClassroomInfoController extends Controller
{
    public function edit(Classroom $classroom): Response
    {
        Gate::authorize('uploadMedia', $classroom);

        return Inertia::render('classrooms/info', [
            'classroom' => [
                'id' => $classroom->id,
                'name' => $classroom->name,
                'color' => $classroom->color,
                'mascot' => $classroom->mascot,
            ],
            'info' => self::info($classroom),
            'activities' => $classroom->activities()
                ->whereDate('date', '>=', now()->subMonth()->startOfMonth())
                ->get()
                ->map(fn (ClassroomActivity $activity) => $activity->toClient()),
            'weekdays' => Classroom::WEEKDAYS,
            'activityTypes' => collect(ClassroomActivity::TYPES)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
        ]);
    }

    public function update(Request $request, Classroom $classroom): RedirectResponse
    {
        Gate::authorize('uploadMedia', $classroom);

        $days = array_keys(Classroom::WEEKDAYS);
        $data = $request->validate([
            'schedule' => ['array', 'max:20'],
            'schedule.*.time' => ['required', 'string', 'max:20'],
            'schedule.*.activity' => ['required', 'string', 'max:120'],
            'supplies' => ['array', 'max:60'],
            'supplies.*.item' => ['required', 'string', 'max:120'],
            'supplies.*.quantity' => ['nullable', 'string', 'max:30'],
            'weekly_menu' => ['array'],
            'weekly_menu.*' => ['array'],
            'weekly_menu.*.snack' => ['nullable', 'string', 'max:150'],
            'weekly_menu.*.lunch' => ['nullable', 'string', 'max:150'],
            'menu_week_of' => ['nullable', 'date'],
        ], [], [
            'schedule.*.time' => 'hora',
            'schedule.*.activity' => 'actividad',
            'supplies.*.item' => 'útil',
        ]);

        $menu = collect($days)->mapWithKeys(fn ($day) => [$day => [
            'snack' => $data['weekly_menu'][$day]['snack'] ?? null,
            'lunch' => $data['weekly_menu'][$day]['lunch'] ?? null,
        ]])->all();

        $classroom->update([
            'schedule' => array_values($data['schedule'] ?? []),
            'supplies' => array_values($data['supplies'] ?? []),
            'weekly_menu' => $menu,
            'menu_week_of' => $data['menu_week_of'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Información del salón actualizada.']);

        return back();
    }

    public function storeActivity(Request $request, Classroom $classroom): RedirectResponse
    {
        Gate::authorize('uploadMedia', $classroom);

        $classroom->activities()->create([
            ...$request->validate([
                'date' => ['required', 'date'],
                'title' => ['required', 'string', 'max:150'],
                'description' => ['nullable', 'string', 'max:1000'],
                'type' => ['required', Rule::in(array_keys(ClassroomActivity::TYPES))],
            ], [], ['title' => 'actividad', 'date' => 'fecha']),
            'created_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Actividad agregada al calendario.']);

        return back();
    }

    public function destroyActivity(ClassroomActivity $activity): RedirectResponse
    {
        Gate::authorize('uploadMedia', $activity->classroom);

        $activity->delete();

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    public static function info(Classroom $classroom): array
    {
        return [
            'schedule' => $classroom->schedule ?? [],
            'supplies' => $classroom->supplies ?? [],
            'weekly_menu' => collect(Classroom::WEEKDAYS)->map(fn ($label, $day) => [
                'snack' => $classroom->weekly_menu[$day]['snack'] ?? null,
                'lunch' => $classroom->weekly_menu[$day]['lunch'] ?? null,
            ])->all(),
            'menu_week_of' => $classroom->menu_week_of?->toDateString(),
        ];
    }
}
