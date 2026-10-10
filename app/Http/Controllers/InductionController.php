<?php

namespace App\Http\Controllers;

use App\Enums\InductionAudience;
use App\Enums\InductionScope;
use App\Http\Requests\InductionLessonRequest;
use App\Models\Classroom;
use App\Models\ContentBlock;
use App\Models\InductionLesson;
use App\Models\Level;
use App\Models\SchoolYear;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\InductionService;
use App\Support\ContentBlocks;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InductionController extends Controller
{
    public function __construct(private readonly InductionService $induction) {}

    /**
     * "Mi inducción": lecciones que le corresponden al usuario y su avance.
     */
    public function mine(Request $request): Response
    {
        $user = $request->user();
        $completed = $user->inductionProgress()->pluck('induction_lesson_id');

        $groups = collect($this->induction->audiencesFor($user))
            ->map(fn (InductionAudience $audience) => [
                'audience' => $audience->value,
                'label' => $audience->label(),
                'lessons' => $this->induction->lessonsFor($user, $audience)
                    ->with(['cover', 'assignments'])
                    ->orderBy('position')
                    ->get()
                    ->map(fn (InductionLesson $lesson) => [
                        ...$this->card($lesson),
                        'completed' => $completed->contains($lesson->id),
                    ]),
            ])
            ->filter(fn ($group) => $group['lessons']->isNotEmpty())
            ->values();

        return Inertia::render('induction/mine', ['groups' => $groups]);
    }

    /**
     * Gestión: la administradora ve todas; la maestra, las de sus salones.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $lessons = InductionLesson::query()
            ->with(['cover', 'assignments'])
            ->withCount('progress')
            ->orderBy('audience')
            ->orderBy('position')
            ->get()
            ->filter(fn (InductionLesson $lesson) => $this->induction->canManage($user, $lesson))
            ->values();

        return Inertia::render('induction/index', [
            'lessons' => $lessons->map(fn (InductionLesson $lesson) => [
                ...$this->card($lesson),
                'completed_count' => $lesson->progress_count,
            ]),
            'classrooms' => $this->classroomOptions($user),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', InductionLesson::class);

        return $this->form($request->user());
    }

    public function store(InductionLessonRequest $request): RedirectResponse
    {
        $lesson = DB::transaction(function () use ($request) {
            $lesson = InductionLesson::create([
                ...$this->attributes($request),
                'author_id' => $request->user()->id,
            ]);
            $this->syncTargets($lesson, $request);
            ContentBlocks::sync($lesson, $request->validated('blocks', []));

            return $lesson;
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $lesson->isPublished() ? 'Lección publicada.' : 'Borrador guardado.',
        ]);

        return to_route('induction.show', $lesson);
    }

    public function show(Request $request, InductionLesson $lesson): Response
    {
        Gate::authorize('view', $lesson);

        $lesson->load(['cover', 'assignments', 'blocks.media']);
        $progress = $lesson->progress()->where('user_id', $request->user()->id)->first();

        return Inertia::render('induction/show', [
            'lesson' => $this->detail($lesson),
            'progress' => $progress ? [
                'completed_at' => $progress->completed_at->toIso8601String(),
                'accepted_at' => $progress->accepted_at?->toIso8601String(),
            ] : null,
            'requiresAcceptance' => $lesson->requiresAcceptance(),
            'canComplete' => $request->user()->can('complete', $lesson),
            'canEdit' => $request->user()->can('update', $lesson),
        ]);
    }

    public function edit(Request $request, InductionLesson $lesson): Response
    {
        Gate::authorize('update', $lesson);

        $lesson->load(['cover', 'assignments', 'blocks.media']);

        return $this->form($request->user(), $lesson);
    }

    public function update(InductionLessonRequest $request, InductionLesson $lesson): RedirectResponse
    {
        DB::transaction(function () use ($request, $lesson) {
            $lesson->update($this->attributes($request));
            $this->syncTargets($lesson, $request);
            ContentBlocks::sync($lesson, $request->validated('blocks', []));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lección actualizada.']);

        return to_route('induction.show', $lesson);
    }

    public function destroy(InductionLesson $lesson): RedirectResponse
    {
        Gate::authorize('delete', $lesson);

        $lesson->blocks()->delete();
        $lesson->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lección eliminada.']);

        return to_route('induction.index');
    }

    /**
     * El padre marca la lección como vista (y acepta, si tiene confirmación).
     */
    public function complete(Request $request, InductionLesson $lesson): RedirectResponse
    {
        Gate::authorize('complete', $lesson);

        $lesson->load('blocks');
        $request->validate([
            'accepted' => $lesson->requiresAcceptance() ? ['accepted'] : ['nullable'],
        ], ['accepted.accepted' => 'Debes marcar la casilla de aceptación.']);

        $lesson->progress()->updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'completed_at' => now(),
                'accepted_at' => $lesson->requiresAcceptance() ? now() : null,
                'ip_address' => $request->ip(),
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => '¡Gracias! Registramos que completaste esta lección.']);

        return to_route('induction.mine');
    }

    /**
     * Tablero por salón: qué padres completaron la inducción obligatoria.
     */
    public function classroomProgress(Request $request, Classroom $classroom): Response
    {
        $user = $request->user();
        abort_unless($user->isAdmin() || $classroom->hasStaffMember($user), 403);

        $lessons = $this->induction->requiredForClassroom($classroom);

        $parents = User::query()
            ->whereHas('children.enrollments', fn (Builder $enrollment) => $enrollment
                ->where('classroom_id', $classroom->id)
                ->where('status', 'active'))
            ->with([
                'children' => fn ($children) => $children->whereHas('enrollments', fn (Builder $enrollment) => $enrollment
                    ->where('classroom_id', $classroom->id)
                    ->where('status', 'active')),
                'inductionProgress' => fn ($progress) => $progress->whereIn('induction_lesson_id', $lessons->pluck('id')),
            ])
            ->orderBy('name')
            ->get();

        $classroom->load('level');

        return Inertia::render('induction/progress', [
            'classroom' => [
                'id' => $classroom->id,
                'name' => $classroom->name,
                'level' => $classroom->level->name,
                'color' => $classroom->color,
                'mascot' => $classroom->mascot,
            ],
            'lessons' => $lessons->map(fn (InductionLesson $lesson) => ['id' => $lesson->id, 'title' => $lesson->title]),
            'parents' => $parents->map(fn (User $parent) => [
                'id' => $parent->id,
                'name' => $parent->name,
                'phone' => $parent->phone,
                'children' => $parent->children->map(fn ($child) => $child->fullName())->values(),
                'completed' => $parent->inductionProgress->pluck('induction_lesson_id')->values(),
            ]),
        ]);
    }

    private function form(User $user, ?InductionLesson $lesson = null): Response
    {
        return Inertia::render('induction/form', [
            'lesson' => $lesson ? $this->detail($lesson) : null,
            'isAdmin' => $user->isAdmin(),
            'levels' => $user->isAdmin()
                ? Level::orderBy('position')->get()->map(fn (Level $level) => ['value' => $level->id, 'label' => $level->name])
                : [],
            'classrooms' => $this->classroomOptions($user),
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    /**
     * @return Collection<int, array{value: int, label: string}>
     */
    private function classroomOptions(User $user)
    {
        return Classroom::query()
            ->manageableBy($user)
            ->where('school_year_id', SchoolYear::current()?->id)
            ->with('level')
            ->orderBy('level_id')
            ->get()
            ->map(fn (Classroom $classroom) => [
                'value' => $classroom->id,
                'label' => "{$classroom->name} ({$classroom->level->name})",
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(InductionLessonRequest $request): array
    {
        return [
            'title' => $request->validated('title'),
            'description' => $request->validated('description'),
            'audience' => $request->validated('audience'),
            'is_required' => $request->boolean('is_required'),
            'status' => $request->validated('status'),
            'position' => $request->validated('position') ?? 0,
            'cover_media_id' => $request->validated('cover_media_id'),
        ];
    }

    private function syncTargets(InductionLesson $lesson, InductionLessonRequest $request): void
    {
        $lesson->assignments()->delete();

        if ($request->boolean('targets.general')) {
            $lesson->assignments()->create(['scope' => InductionScope::General]);

            return;
        }

        foreach (array_unique($request->input('targets.level_ids', [])) as $levelId) {
            $lesson->assignments()->create(['scope' => InductionScope::Level, 'scope_id' => $levelId]);
        }

        foreach (array_unique($request->input('targets.classroom_ids', [])) as $classroomId) {
            $lesson->assignments()->create(['scope' => InductionScope::Classroom, 'scope_id' => $classroomId]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function card(InductionLesson $lesson): array
    {
        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'description' => $lesson->description,
            'audience' => $lesson->audience->value,
            'is_required' => $lesson->is_required,
            'status' => $lesson->status->value,
            'cover' => $lesson->cover?->toClient(),
            'targets' => $this->targets($lesson),
        ];
    }

    /**
     * @return array{general: bool, level_ids: list<int>, classroom_ids: list<int>}
     */
    private function targets(InductionLesson $lesson): array
    {
        $byScope = fn (InductionScope $scope) => $lesson->assignments
            ->where('scope', $scope)
            ->pluck('scope_id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        return [
            'general' => $lesson->assignments->contains('scope', InductionScope::General),
            'level_ids' => $byScope(InductionScope::Level),
            'classroom_ids' => $byScope(InductionScope::Classroom),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function detail(InductionLesson $lesson): array
    {
        return [
            ...$this->card($lesson),
            'position' => $lesson->position,
            'cover_media_id' => $lesson->cover_media_id,
            'blocks' => $lesson->blocks->map(fn (ContentBlock $block) => $block->toClient()),
        ];
    }
}
