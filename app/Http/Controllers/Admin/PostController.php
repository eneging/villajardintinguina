<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Post;
use App\Services\CloudinaryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Noticias del sitio web: actividades, logros y consejos para las familias.
 */
class PostController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/posts/index', [
            'posts' => Post::query()->with('cover')->latest('id')->get()->map(fn (Post $post) => [
                ...$post->toCard(),
                'published' => $post->published_at !== null,
            ]),
        ]);
    }

    public function create(): Response
    {
        return $this->form();
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        Post::create([...$data, 'slug' => $this->slug($data['title']), 'author_id' => $request->user()->id]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Noticia guardada.']);

        return to_route('admin.posts.index');
    }

    public function edit(Post $post): Response
    {
        return $this->form($post);
    }

    public function update(Request $request, Post $post): RedirectResponse
    {
        $post->update($this->validated($request, $post));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Noticia actualizada.']);

        return to_route('admin.posts.index');
    }

    public function destroy(Post $post): RedirectResponse
    {
        $post->delete();

        return to_route('admin.posts.index');
    }

    private function form(?Post $post = null): Response
    {
        $post?->load('cover');

        return Inertia::render('admin/posts/form', [
            'post' => $post ? [
                ...$post->only(['id', 'title', 'excerpt', 'body', 'cover_media_id', 'slug']),
                'cover' => $post->cover?->toClient(),
                'published' => $post->published_at !== null,
            ] : null,
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Post $post = null): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'excerpt' => ['nullable', 'string', 'max:300'],
            'body' => ['required', 'string', 'max:20000'],
            'cover_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'published' => ['boolean'],
        ], [], ['title' => 'título', 'body' => 'texto']);

        if (! empty($data['cover_media_id']) && ! app(CloudinaryService::class)->belongsToFolder(Media::find($data['cover_media_id'])->public_id, 'sitio')) {
            throw ValidationException::withMessages(['cover_media_id' => 'La imagen no es válida.']);
        }

        $publish = (bool) ($data['published'] ?? false);
        unset($data['published']);

        return [...$data, 'published_at' => $publish ? ($post?->published_at ?? now()) : null];
    }

    private function slug(string $title): string
    {
        $base = Str::slug($title) ?: 'noticia';
        $slug = $base;
        $i = 2;

        while (Post::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
