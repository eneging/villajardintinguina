<?php

namespace App\Http\Controllers;

use App\Enums\LearningArea;
use App\Models\Classroom;
use App\Models\LearningModule;
use App\Models\SchoolYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClassroomController extends Controller
{
    /**
     * Salones que la administradora o la maestra gestionan.
     */
    public function index(Request $request): Response
    {
        $classrooms = Classroom::query()
            ->manageableBy($request->user())
            ->where('school_year_id', SchoolYear::current()?->id)
            ->with(['level', 'staff'])
            ->withCount(['enrollments', 'learningModules', 'publishedModules'])
            ->orderBy('level_id')
            ->get();

        return Inertia::render('classrooms/index', [
            'classrooms' => $classrooms->map(fn (Classroom $classroom) => $this->summary($classroom)),
        ]);
    }

    /**
     * Página "Mi Salón": información del salón y sus módulos de aprendizaje.
     */
    public function show(Request $request, Classroom $classroom): Response
    {
        Gate::authorize('view', $classroom);

        $user = $request->user();
        $canManage = $user->can('create', [LearningModule::class, $classroom]);

        $modules = $classroom->learningModules()
            ->unless($canManage, fn ($query) => $query->where('status', 'published'))
            ->with('cover')
            ->orderByDesc('starts_on')
            ->get();

        $classroom->load(['level', 'staff', 'cover']);

        return Inertia::render('classrooms/show', [
            'classroom' => [
                ...$this->summary($classroom),
                'description' => $classroom->description,
                'cover' => $classroom->cover?->toClient(),
            ],
            'modules' => $modules->map(fn (LearningModule $module) => self::moduleCard($module)),
            'children' => $user->children()
                ->whereHas('currentEnrollment', fn ($query) => $query->whereBelongsTo($classroom))
                ->get()
                ->map(fn ($student) => ['id' => $student->id, 'name' => $student->fullName()]),
            'canManage' => $canManage,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Classroom $classroom): array
    {
        return [
            'id' => $classroom->id,
            'name' => $classroom->name,
            'level' => $classroom->level->name,
            'shift' => $classroom->shift,
            'color' => $classroom->color,
            'mascot' => $classroom->mascot,
            'staff' => $classroom->staff->map(fn ($member) => [
                'id' => $member->id,
                'name' => $member->name,
                'role' => $member->pivot->role,
            ]),
            'students_count' => $classroom->enrollments_count ?? null,
            'modules_count' => $classroom->learning_modules_count ?? null,
            'published_modules_count' => $classroom->published_modules_count ?? null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function moduleCard(LearningModule $module): array
    {
        return [
            'id' => $module->id,
            'title' => $module->title,
            'area' => $module->area->value,
            'area_label' => $module->area->label(),
            'summary' => $module->summary,
            'starts_on' => $module->starts_on->toDateString(),
            'ends_on' => $module->ends_on->toDateString(),
            'status' => $module->status->value,
            'cover' => $module->cover?->toClient(),
        ];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function areaOptions(): array
    {
        return LearningArea::options();
    }
}
