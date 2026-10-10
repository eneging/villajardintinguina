<?php

namespace App\Http\Controllers;

use App\Enums\ModuleStatus;
use App\Http\Requests\LearningModuleRequest;
use App\Models\Classroom;
use App\Models\ContentBlock;
use App\Models\LearningModule;
use App\Services\CloudinaryService;
use App\Support\ContentBlocks;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LearningModuleController extends Controller
{
    public function create(Classroom $classroom): Response
    {
        Gate::authorize('create', [LearningModule::class, $classroom]);

        return $this->form($classroom);
    }

    public function store(LearningModuleRequest $request, Classroom $classroom): RedirectResponse
    {
        $module = DB::transaction(function () use ($request, $classroom) {
            $module = $classroom->learningModules()->create([
                ...$this->attributes($request),
                'author_id' => $request->user()->id,
            ]);
            ContentBlocks::sync($module, $request->validated('blocks', []));

            return $module;
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $module->isPublished() ? 'Módulo publicado para los padres.' : 'Borrador guardado.',
        ]);

        return to_route('modules.show', $module);
    }

    public function show(LearningModule $module): Response
    {
        Gate::authorize('view', $module);

        $module->load(['classroom.level', 'cover', 'author', 'blocks.media']);

        return Inertia::render('modules/show', [
            'module' => $this->detail($module),
            'classroom' => [
                'id' => $module->classroom->id,
                'name' => $module->classroom->name,
                'level' => $module->classroom->level->name,
                'color' => $module->classroom->color,
                'mascot' => $module->classroom->mascot,
            ],
            'canEdit' => request()->user()->can('update', $module),
        ]);
    }

    public function edit(LearningModule $module): Response
    {
        Gate::authorize('update', $module);

        $module->load(['cover', 'blocks.media']);

        return $this->form($module->classroom, $module);
    }

    public function update(LearningModuleRequest $request, LearningModule $module): RedirectResponse
    {
        DB::transaction(function () use ($request, $module) {
            $module->update($this->attributes($request, $module));
            ContentBlocks::sync($module, $request->validated('blocks', []));
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Módulo actualizado.',
        ]);

        return to_route('modules.show', $module);
    }

    public function destroy(LearningModule $module): RedirectResponse
    {
        Gate::authorize('delete', $module);

        $classroom = $module->classroom;
        $module->blocks()->delete();
        $module->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Módulo eliminado.',
        ]);

        return to_route('classrooms.show', $classroom);
    }

    private function form(Classroom $classroom, ?LearningModule $module = null): Response
    {
        $classroom->load('level');

        return Inertia::render('modules/form', [
            'classroom' => [
                'id' => $classroom->id,
                'name' => $classroom->name,
                'level' => $classroom->level->name,
                'color' => $classroom->color,
            ],
            'module' => $module ? $this->detail($module) : null,
            'areas' => ClassroomController::areaOptions(),
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(LearningModuleRequest $request, ?LearningModule $module = null): array
    {
        $data = $request->safe()->except('blocks');
        $data['goals'] = array_values(array_filter($data['goals'] ?? [], 'filled'));

        $publishing = $data['status'] === ModuleStatus::Published->value;
        $data['published_at'] = $publishing ? ($module?->published_at ?? now()) : null;

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function detail(LearningModule $module): array
    {
        return [
            ...ClassroomController::moduleCard($module),
            'goals' => $module->goals ?? [],
            'cover_media_id' => $module->cover_media_id,
            'author' => $module->author?->name,
            'published_at' => $module->published_at?->toIso8601String(),
            'blocks' => $module->blocks->map(fn (ContentBlock $block) => $block->toClient()),
        ];
    }
}
