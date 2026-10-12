<?php

namespace App\Http\Controllers\Public;

use App\Enums\ModuleStatus;
use App\Http\Controllers\Controller;
use App\Mail\LeadReceived;
use App\Models\Album;
use App\Models\AlbumItem;
use App\Models\ContentBlock;
use App\Models\InductionLesson;
use App\Models\Lead;
use App\Models\SiteContent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Sitio público para las familias: todo el contenido sale de `site_contents`,
 * de las lecciones de inducción marcadas como públicas y de los álbumes
 * públicos (con autorización de imagen confirmada).
 */
class SiteController extends Controller
{
    public function home(): Response
    {
        $site = SiteContent::sections();

        return Inertia::render('welcome', [
            'content' => SiteContent::withMedia([
                'hero' => $site['hero'],
                'levels' => $site['levels'],
                'services' => $site['services'],
                'testimonials' => $site['testimonials'],
                'schedule' => $site['schedule'],
                'admission' => ['open' => $site['admission']['open']],
            ]),
            'videos' => $this->publicLessons()->limit(3)->get()->map(fn (InductionLesson $lesson) => $this->lessonCard($lesson)),
            'albums' => $this->publicAlbums()->limit(4)->get()->map(fn (Album $album) => $album->toCard()),
        ]);
    }

    public function about(): Response
    {
        $site = SiteContent::sections();

        return Inertia::render('public/about', [
            'content' => SiteContent::withMedia([
                'about' => $site['about'],
                'team' => $site['team'],
                'schedule' => $site['schedule'],
            ]),
        ]);
    }

    public function services(): Response
    {
        $site = SiteContent::sections();

        return Inertia::render('public/services', [
            'content' => [
                'services' => $site['services'],
                'levels' => $site['levels'],
                'schedule' => $site['schedule'],
                'testimonials' => $site['testimonials'],
            ],
        ]);
    }

    public function videos(): Response
    {
        return Inertia::render('public/videos', [
            'lessons' => $this->publicLessons()->get()->map(fn (InductionLesson $lesson) => $this->lessonCard($lesson)),
        ]);
    }

    public function video(InductionLesson $lesson): Response
    {
        abort_unless($lesson->is_public && $lesson->isPublished(), 404);

        $lesson->load(['cover', 'blocks.media']);

        return Inertia::render('public/video', [
            'lesson' => [
                ...$this->lessonCard($lesson),
                // Las actividades y confirmaciones son para familias matriculadas.
                'blocks' => $lesson->blocks
                    ->reject(fn (ContentBlock $block) => in_array($block->type->value, ['activity', 'confirmation'], true))
                    ->values()
                    ->map(fn (ContentBlock $block) => $block->toClient()),
            ],
        ]);
    }

    public function gallery(): Response
    {
        return Inertia::render('public/gallery', [
            'albums' => $this->publicAlbums()->get()->map(fn (Album $album) => $album->toCard()),
        ]);
    }

    public function album(Album $album): Response
    {
        abort_unless($this->publicAlbums()->whereKey($album->id)->exists(), 404);

        $album->load(['items.media', 'classroom'])->loadCount('items');

        return Inertia::render('public/album', [
            'album' => [
                ...$album->toCard(),
                'items' => $album->items->filter(fn (AlbumItem $item) => $item->media)->values()->map(fn (AlbumItem $item) => [
                    'id' => $item->id,
                    'caption' => $item->caption,
                    'media' => $item->media->toClient(),
                ]),
            ],
        ]);
    }

    public function admission(): Response
    {
        $site = SiteContent::sections();

        return Inertia::render('public/admission', [
            'content' => [
                'admission' => $site['admission'],
                'levels' => collect($site['levels']['items'])->pluck('name')->values(),
                'contact' => $site['contact'],
            ],
        ]);
    }

    public function storeLead(Request $request): RedirectResponse
    {
        // Campo trampa para bots: las personas no lo ven.
        if (filled($request->input('website'))) {
            return back();
        }

        $data = $request->validate([
            'parent_name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'regex:/^\+?[0-9 ]{9,15}$/'],
            'email' => ['nullable', 'email', 'max:255'],
            'child_name' => ['nullable', 'string', 'max:150'],
            'child_birth_date' => ['nullable', 'date', 'before_or_equal:today', 'after:'.now()->subYears(7)->toDateString()],
            'level_interest' => ['nullable', 'string', 'max:60'],
            'message' => ['nullable', 'string', 'max:2000'],
            'privacy' => ['accepted'],
        ], [], [
            'parent_name' => 'nombre',
            'phone' => 'celular',
            'child_name' => 'nombre del niño',
            'child_birth_date' => 'fecha de nacimiento',
            'message' => 'mensaje',
            'privacy' => 'autorización de datos',
        ]);

        $lead = Lead::create([
            ...collect($data)->except('privacy')->all(),
            'source' => 'web',
            'ip_address' => $request->ip(),
        ]);

        try {
            Mail::to(config('school.email'))->send(new LeadReceived($lead));
        } catch (Throwable $exception) {
            // La solicitud ya quedó guardada; el aviso por correo no debe impedirlo.
            report($exception);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => '¡Gracias! Te contactaremos muy pronto.']);

        return to_route('admission');
    }

    /**
     * @return Builder<InductionLesson>
     */
    private function publicLessons(): Builder
    {
        return InductionLesson::query()
            ->with('cover')
            ->where('is_public', true)
            ->where('status', ModuleStatus::Published)
            ->orderBy('position')
            ->orderBy('id');
    }

    /**
     * @return Builder<Album>
     */
    private function publicAlbums(): Builder
    {
        return Album::query()
            ->with(['coverItem.media', 'classroom'])
            ->withCount('items')
            ->where('is_public', true)
            ->where('published', true)
            ->whereNotNull('consent_confirmed_at')
            ->has('items')
            ->latest('date');
    }

    /**
     * @return array<string, mixed>
     */
    private function lessonCard(InductionLesson $lesson): array
    {
        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'description' => $lesson->description,
            'cover' => $lesson->cover?->toClient(),
        ];
    }
}
