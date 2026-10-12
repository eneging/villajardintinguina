<?php

namespace App\Http\Controllers;

use App\Enums\InductionAudience;
use App\Enums\Role;
use App\Models\Album;
use App\Models\AlbumItem;
use App\Models\Classroom;
use App\Models\Media;
use App\Models\Student;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\InductionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Galería privada por salón: álbumes de fotos y videos solo para su comunidad.
 */
class GalleryController extends Controller
{
    public function __construct(private readonly CloudinaryService $cloudinary) {}

    public function index(Request $request, Classroom $classroom): Response
    {
        Gate::authorize('view', $classroom);

        $canManage = $request->user()->can('uploadMedia', $classroom);

        $albums = $classroom->albums()
            ->unless($canManage || $classroom->hasStaffMember($request->user()), fn ($q) => $q->where('published', true))
            ->with('coverItem.media')
            ->withCount('items')
            ->orderByDesc('date')
            ->get();

        return Inertia::render('gallery/index', [
            'classroom' => $this->classroomInfo($classroom),
            'albums' => $albums->map(fn (Album $album) => $album->toCard()),
            'canManage' => $canManage,
        ]);
    }

    public function store(Request $request, Classroom $classroom): RedirectResponse
    {
        Gate::authorize('uploadMedia', $classroom);

        $album = $classroom->albums()->create([...$this->validated($request), 'created_by' => $request->user()->id]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Álbum creado. Ahora sube las fotos.']);

        return to_route('gallery.show', $album);
    }

    public function show(Request $request, Album $album): Response
    {
        Gate::authorize('view', $album);

        $album->load(['classroom.level', 'items.media', 'consentConfirmer']);
        $canManage = $request->user()->can('update', $album);

        return Inertia::render('gallery/show', [
            'classroom' => $this->classroomInfo($album->classroom),
            'album' => [
                ...$album->toCard(),
                'consent_confirmed_by' => $album->consentConfirmer?->name,
                'consent_confirmed_at' => $album->consent_confirmed_at?->toIso8601String(),
            ],
            'items' => $album->items->map(fn (AlbumItem $item) => [
                'id' => $item->id,
                'caption' => $item->caption,
                'media' => $item->media->toClient(),
                'download_url' => $this->cloudinary->isConfigured() ? $this->cloudinary->downloadUrl($item->media) : null,
            ]),
            'canManage' => $canManage,
            // Para que la maestra revise antes de publicar.
            'withoutConsent' => $canManage ? $this->studentsWithoutConsent($album->classroom) : [],
            'cloudinaryEnabled' => $this->cloudinary->isConfigured(),
        ]);
    }

    public function update(Request $request, Album $album): RedirectResponse
    {
        Gate::authorize('update', $album);

        $album->update($this->validated($request));

        return back();
    }

    /**
     * Publicar exige confirmar que no aparecen niños sin autorización de imagen.
     */
    public function publish(Request $request, Album $album): RedirectResponse
    {
        Gate::authorize('update', $album);

        $data = $request->validate([
            'published' => ['required', 'boolean'],
            'consent_confirmed' => ['exclude_unless:published,true', 'accepted'],
        ], ['consent_confirmed.accepted' => 'Confirma que en las fotos no aparecen niños sin autorización de imagen.']);

        if ($data['published'] && $album->items()->doesntExist()) {
            throw ValidationException::withMessages(['published' => 'Sube al menos una foto antes de publicar.']);
        }

        $album->update($data['published']
            ? ['published' => true, 'consent_confirmed_by' => $request->user()->id, 'consent_confirmed_at' => now()]
            : ['published' => false, 'is_public' => false]);

        Inertia::flash('toast', ['type' => 'success', 'message' => $data['published'] ? 'Álbum publicado para las familias del salón.' : 'Álbum ocultado.']);

        return back();
    }

    /**
     * Mostrar el álbum en la galería del sitio web (solo la administradora).
     */
    public function togglePublic(Request $request, Album $album): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $data = $request->validate([
            'is_public' => ['required', 'boolean'],
            'consent_confirmed' => ['exclude_unless:is_public,true', 'accepted'],
        ], ['consent_confirmed.accepted' => 'Confirma que todas las familias que aparecen autorizaron el uso de imagen en el sitio web.']);

        if ($data['is_public'] && ! $album->published) {
            throw ValidationException::withMessages(['is_public' => 'Primero publica el álbum para las familias del salón.']);
        }

        $album->update(['is_public' => $data['is_public']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => $data['is_public'] ? 'El álbum ahora se ve en el sitio web.' : 'El álbum ya no se muestra en el sitio web.']);

        return back();
    }

    public function destroy(Album $album): RedirectResponse
    {
        Gate::authorize('delete', $album);

        $classroom = $album->classroom;

        DB::transaction(function () use ($album) {
            foreach ($album->items()->with('media')->get() as $item) {
                $this->removeItem($item);
            }

            $album->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Álbum eliminado.']);

        return to_route('gallery.index', $classroom);
    }

    /**
     * Agrega las fotos/videos ya subidos a Cloudinary (carpeta del salón).
     */
    public function addItems(Request $request, Album $album): RedirectResponse
    {
        Gate::authorize('update', $album);

        $data = $request->validate([
            'media_ids' => ['required', 'array', 'min:1', 'max:100'],
            'media_ids.*' => ['integer', 'distinct', 'exists:media,id'],
        ]);

        $media = Media::query()->whereKey($data['media_ids'])->get();

        foreach ($media as $item) {
            if (! $this->cloudinary->belongsToFolder($item->public_id, "salones/{$album->classroom_id}") || $item->resource_type === 'raw') {
                throw ValidationException::withMessages(['media_ids' => 'Uno de los archivos no pertenece a este salón.']);
            }
        }

        $position = (int) $album->items()->max('position');

        foreach ($data['media_ids'] as $mediaId) {
            $album->items()->firstOrCreate(['media_id' => $mediaId], [
                'position' => ++$position,
                'uploaded_by' => $request->user()->id,
            ]);
        }

        return back();
    }

    public function updateItem(Request $request, AlbumItem $item): RedirectResponse
    {
        Gate::authorize('update', $item->album);

        $item->update($request->validate(['caption' => ['nullable', 'string', 'max:255']]));

        return back();
    }

    public function destroyItem(AlbumItem $item): RedirectResponse
    {
        Gate::authorize('update', $item->album);

        $this->removeItem($item);

        return back();
    }

    private function removeItem(AlbumItem $item): void
    {
        $media = $item->media;
        $item->delete();

        // Si el archivo no se usa en otro lugar, se borra también de Cloudinary.
        if ($media && ! AlbumItem::where('media_id', $media->id)->exists()) {
            $this->cloudinary->destroy($media);
            $media->delete();
        }
    }

    /**
     * @return list<string>
     */
    private function studentsWithoutConsent(Classroom $classroom): array
    {
        return Student::query()
            ->where('image_consent', false)
            ->whereHas('enrollments', fn ($q) => $q->where('classroom_id', $classroom->id)->where('status', 'active'))
            ->orderBy('last_name')
            ->get()
            ->map(fn (Student $student) => $student->fullName())
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function classroomInfo(Classroom $classroom): array
    {
        return ['id' => $classroom->id, 'name' => $classroom->name, 'color' => $classroom->color, 'mascot' => $classroom->mascot];
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'date' => ['required', 'date', 'before_or_equal:today'],
        ], [], ['title' => 'título', 'date' => 'fecha']);
    }

    /**
     * Álbumes publicados recientes de los salones de los hijos (para el inicio).
     *
     * @return list<array<string, mixed>>
     */
    public static function latestForParent(User $user, int $limit = 3): array
    {
        if (! $user->hasRole(Role::Parent)) {
            return [];
        }

        $classroomIds = app(InductionService::class)
            ->classroomsFor($user, InductionAudience::Parents)
            ->pluck('id');

        return Album::query()
            ->whereIn('classroom_id', $classroomIds)
            ->where('published', true)
            ->with(['coverItem.media', 'classroom'])
            ->withCount('items')
            ->orderByDesc('date')
            ->limit($limit)
            ->get()
            ->map(fn (Album $album) => $album->toCard())
            ->all();
    }
}
