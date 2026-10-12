<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\Announcement;
use App\Models\Classroom;
use App\Models\SchoolYear;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Comunicados: generales (administración) o por salón (administración y maestras).
 */
class AnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('announcements/index', [
            'announcements' => Announcement::query()
                ->visibleTo($user)
                ->with(['classroom', 'author'])
                ->orderByDesc('pinned')
                ->latest()
                ->limit(100)
                ->get()
                ->map(fn (Announcement $announcement) => $announcement->toClient($user)),
            'targets' => $this->targets($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $allowed = collect($this->targets($request))->pluck('value');
        abort_if($allowed->isEmpty(), 403);

        $data = $request->validate([
            'classroom_id' => ['nullable', 'integer', Rule::in($allowed->filter()->values())],
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string', 'max:5000'],
            'pinned' => ['boolean'],
        ], [], ['title' => 'título', 'body' => 'mensaje', 'classroom_id' => 'salón']);

        abort_if(empty($data['classroom_id']) && ! $request->user()->isAdmin(), 403);

        Announcement::create([...$data, 'author_id' => $request->user()->id]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Comunicado publicado.']);

        return back();
    }

    public function update(Request $request, Announcement $announcement): RedirectResponse
    {
        abort_unless($request->user()->isAdmin() || $request->user()->id === $announcement->author_id, 403);

        $announcement->update($request->validate([
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string', 'max:5000'],
            'pinned' => ['boolean'],
        ], [], ['title' => 'título', 'body' => 'mensaje']));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Comunicado actualizado.']);

        return back();
    }

    public function destroy(Request $request, Announcement $announcement): RedirectResponse
    {
        abort_unless($request->user()->isAdmin() || $request->user()->id === $announcement->author_id, 403);

        $announcement->delete();

        return back();
    }

    /**
     * A quién puede escribir la persona: "todo el colegio" (solo administración) y sus salones.
     *
     * @return list<array{value: int|null, label: string}>
     */
    private function targets(Request $request): array
    {
        $user = $request->user();

        if (! $user->hasRole(Role::Admin, Role::Teacher)) {
            return [];
        }

        $classrooms = Classroom::query()
            ->manageableBy($user)
            ->where('school_year_id', SchoolYear::current()?->id)
            ->orderBy('level_id')
            ->get()
            ->map(fn (Classroom $classroom) => ['value' => $classroom->id, 'label' => "Salón {$classroom->name}"]);

        return [
            ...($user->isAdmin() ? [['value' => null, 'label' => 'Todo el colegio']] : []),
            ...$classrooms,
        ];
    }
}
