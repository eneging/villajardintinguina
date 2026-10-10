<?php

namespace App\Http\Controllers;

use App\Enums\InductionAudience;
use App\Enums\ModuleStatus;
use App\Enums\Role;
use App\Models\Classroom;
use App\Models\LearningModule;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Services\InductionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, InductionService $induction): Response
    {
        $user = $request->user();

        $children = $user->hasRole(Role::Parent)
            ? $user->children()->with('currentEnrollment.classroom.level')->get()
                ->map(fn (Student $student) => [
                    'id' => $student->id,
                    'name' => $student->fullName(),
                    'classroom' => $student->currentEnrollment ? [
                        'id' => $student->currentEnrollment->classroom->id,
                        'name' => $student->currentEnrollment->classroom->name,
                        'level' => $student->currentEnrollment->classroom->level->name,
                        'color' => $student->currentEnrollment->classroom->color,
                        'mascot' => $student->currentEnrollment->classroom->mascot,
                    ] : null,
                ])
            : collect();

        $classroomIds = $children->pluck('classroom.id')->filter()->unique();

        $latestModules = LearningModule::query()
            ->whereIn('classroom_id', $classroomIds)
            ->where('status', ModuleStatus::Published)
            ->with(['cover', 'classroom'])
            ->orderByDesc('starts_on')
            ->limit(6)
            ->get()
            ->map(fn (LearningModule $module) => [
                ...ClassroomController::moduleCard($module),
                'classroom' => $module->classroom->name,
            ]);

        $managed = $user->hasRole(Role::Admin, Role::Teacher)
            ? Classroom::query()->manageableBy($user)->where('school_year_id', SchoolYear::current()?->id)
                ->with('level')->withCount(['enrollments', 'publishedModules'])->get()
                ->map(fn (Classroom $classroom) => [
                    'id' => $classroom->id,
                    'name' => $classroom->name,
                    'level' => $classroom->level->name,
                    'color' => $classroom->color,
                    'mascot' => $classroom->mascot,
                    'students_count' => $classroom->enrollments_count,
                    'published_modules_count' => $classroom->published_modules_count,
                ])
            : collect();

        $inductionSummary = null;

        if ($user->hasRole(Role::Parent)) {
            $required = $induction->lessonsFor($user, InductionAudience::Parents)
                ->where('is_required', true)
                ->pluck('id');
            $inductionSummary = [
                'required' => $required->count(),
                'completed' => $user->inductionProgress()->whereIn('induction_lesson_id', $required)->count(),
            ];
        }

        return Inertia::render('dashboard', [
            'induction' => $inductionSummary,
            'children' => $children,
            'latestModules' => $latestModules,
            'managedClassrooms' => $managed,
        ]);
    }
}
