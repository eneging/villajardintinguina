<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Media;
use App\Models\SiteContent;
use App\Services\CloudinaryService;
use App\Support\SiteDefaults;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Editor del sitio público: cada sección se guarda por separado.
 */
class SiteContentController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/site/index', [
            'sections' => SiteContent::withMedia(SiteContent::sections()),
            'icons' => SiteDefaults::ICONS,
            'newLeads' => Lead::where('status', 'nuevo')->count(),
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    public function update(Request $request, string $section): RedirectResponse
    {
        abort_unless(array_key_exists($section, SiteDefaults::all()), 404);

        $value = $request->validate($this->rules($section), [], [
            'items.*.title' => 'título',
            'items.*.text' => 'texto',
            'items.*.name' => 'nombre',
        ]);

        SiteContent::updateOrCreate(
            ['section' => $section],
            ['value' => $value, 'updated_by' => $request->user()->id],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sitio web actualizado.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(string $section): array
    {
        $text = fn (int $max = 255) => ['nullable', 'string', 'max:'.$max];
        // Solo archivos subidos para el sitio: nunca vouchers, documentos ni fotos de salones.
        $media = ['nullable', 'integer', function (string $attribute, mixed $value, \Closure $fail) {
            $publicId = Media::whereKey($value)->value('public_id');

            if (! $publicId || ! app(CloudinaryService::class)->belongsToFolder($publicId, 'sitio')) {
                $fail('El archivo no es válido para el sitio web.');
            }
        }];
        $icon = ['required', Rule::in(SiteDefaults::ICONS)];

        return match ($section) {
            'hero' => [
                'badge' => $text(60),
                'title' => ['required', 'string', 'max:80'],
                'highlight' => $text(40),
                'title_end' => $text(80),
                'subtitle' => $text(400),
                'image_media_id' => $media,
                'video_media_id' => $media,
                'video_url' => ['nullable', 'url', 'max:255'],
            ],
            'about' => [
                'title' => ['required', 'string', 'max:100'],
                'intro' => $text(1500),
                'mission' => $text(800),
                'vision' => $text(800),
                'values' => ['array', 'max:10'],
                'values.*' => ['required', 'string', 'max:40'],
                'proposal_title' => $text(100),
                'proposal' => $text(3000),
                'pillars' => ['array', 'max:8'],
                'pillars.*.icon' => $icon,
                'pillars.*.title' => ['required', 'string', 'max:60'],
                'pillars.*.text' => $text(300),
                'image_media_id' => $media,
            ],
            'levels' => [
                'items' => ['array', 'max:8'],
                'items.*.name' => ['required', 'string', 'max:60'],
                'items.*.age' => $text(60),
                'items.*.mascot' => $text(8),
                'items.*.color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
                'items.*.text' => $text(300),
            ],
            'services' => [
                'items' => ['array', 'max:12'],
                'items.*.icon' => $icon,
                'items.*.title' => ['required', 'string', 'max:60'],
                'items.*.text' => $text(300),
            ],
            'schedule' => [
                'items' => ['array', 'max:8'],
                'items.*.label' => ['required', 'string', 'max:60'],
                'items.*.hours' => ['required', 'string', 'max:120'],
            ],
            'team' => [
                'intro' => $text(300),
                'items' => ['array', 'max:30'],
                'items.*.name' => ['required', 'string', 'max:100'],
                'items.*.role' => $text(80),
                'items.*.bio' => $text(400),
                'items.*.photo_media_id' => $media,
            ],
            'testimonials' => [
                'items' => ['array', 'max:12'],
                'items.*.name' => ['required', 'string', 'max:80'],
                'items.*.relation' => $text(80),
                'items.*.text' => ['required', 'string', 'max:600'],
            ],
            'contact' => [
                'phone' => $text(30),
                'email' => ['nullable', 'email', 'max:255'],
                'address' => $text(255),
                'hours' => $text(120),
                'map_query' => $text(255),
                'facebook' => ['nullable', 'url', 'max:255'],
                'instagram' => ['nullable', 'url', 'max:255'],
                'tiktok' => ['nullable', 'url', 'max:255'],
                'youtube' => ['nullable', 'url', 'max:255'],
            ],
            'admission' => [
                'open' => ['boolean'],
                'title' => ['required', 'string', 'max:80'],
                'text' => $text(800),
                'steps' => ['array', 'max:8'],
                'steps.*' => ['required', 'string', 'max:150'],
                'requirements' => ['array', 'max:12'],
                'requirements.*' => ['required', 'string', 'max:150'],
            ],
        };
    }
}
