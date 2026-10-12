<?php

namespace Tests\Feature;

use App\Enums\ModuleStatus;
use App\Mail\LeadReceived;
use App\Models\Album;
use App\Models\Classroom;
use App\Models\InductionLesson;
use App\Models\Lead;
use App\Models\Media;
use App\Models\SiteContent;
use App\Models\User;
use App\Services\CloudinaryService;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicSiteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->app->instance(CloudinaryService::class, new CloudinaryService('demo', 'key', 'secret', 'vj'));
    }

    private function admin(): User
    {
        return User::where('email', 'admin@villajardin.test')->firstOrFail();
    }

    public function test_public_pages_render_with_default_content(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('content.hero.highlight', 'florecen')
            ->has('content.levels.items', 4)
            ->has('contact'));

        foreach (['about' => 'public/about', 'services' => 'public/services', 'videos' => 'public/videos', 'photos' => 'public/gallery', 'admission' => 'public/admission'] as $route => $component) {
            $this->get(route($route))->assertOk()->assertInertia(fn (Assert $page) => $page->component($component));
        }
    }

    public function test_admin_edits_site_sections_and_public_pages_show_them(): void
    {
        $photo = Media::create(['public_id' => 'vj/sitio/maestra', 'resource_type' => 'image', 'delivery_type' => 'authenticated', 'format' => 'jpg']);

        $this->actingAs($this->admin())
            ->put(route('admin.site.update', 'team'), [
                'intro' => 'Nuestro equipo',
                'items' => [['name' => 'Miss Rosa', 'role' => 'Maestra de 3 años', 'bio' => null, 'photo_media_id' => $photo->id, 'photo' => ['url' => 'x']]],
            ])
            ->assertSessionHasNoErrors();

        $this->actingAs($this->admin())
            ->put(route('admin.site.update', 'contact'), ['phone' => '056 123456', 'facebook' => 'https://facebook.com/villajardin', 'map_query' => 'Ica'])
            ->assertSessionHasNoErrors();

        $this->assertSame(['name', 'role', 'bio', 'photo_media_id'], array_keys(SiteContent::firstWhere('section', 'team')->value['items'][0]));

        $this->get(route('about'))->assertInertia(fn (Assert $page) => $page
            ->where('content.team.items.0.name', 'Miss Rosa')
            ->where('content.team.items.0.photo.id', $photo->id)
            ->where('contact.phone', '056 123456'));
    }

    public function test_site_editor_is_admin_only_and_validates(): void
    {
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();

        $this->actingAs($teacher)->get(route('admin.site.index'))->assertForbidden();
        $this->actingAs($this->admin())->get(route('admin.site.index'))->assertOk();

        $this->actingAs($this->admin())
            ->put(route('admin.site.update', 'services'), ['items' => [['icon' => 'virus', 'title' => '']]])
            ->assertSessionHasErrors(['items.0.icon', 'items.0.title']);

        $this->actingAs($this->admin())->put(route('admin.site.update', 'nope'), [])->assertNotFound();
    }

    public function test_family_requests_admission_and_admin_follows_up(): void
    {
        Mail::fake();

        $this->post(route('admission.store'), [
            'parent_name' => 'Lucía Torres',
            'phone' => '987654321',
            'child_name' => 'Mateo',
            'child_birth_date' => now()->subYears(3)->toDateString(),
            'level_interest' => 'Inicial 3 años',
            'privacy' => true,
        ])->assertRedirect(route('admission'));

        $lead = Lead::sole();
        $this->assertSame('nuevo', $lead->status);
        Mail::assertSent(LeadReceived::class, fn ($mail) => $mail->hasTo(config('school.email')));

        $this->actingAs($this->admin())->get(route('admin.leads.index'))->assertInertia(fn (Assert $page) => $page
            ->component('admin/leads/index')
            ->where('leads.data.0.whatsapp', '51987654321')
            ->where('leads.data.0.child_age', '3 años'));

        $this->actingAs($this->admin())
            ->put(route('admin.leads.update', $lead), ['status' => 'visita', 'notes' => 'Viene el jueves'])
            ->assertSessionHasNoErrors();

        $this->assertNotNull($lead->fresh()->contacted_at);
    }

    public function test_admission_requires_privacy_consent_and_ignores_bots(): void
    {
        $this->post(route('admission.store'), ['parent_name' => 'X', 'phone' => '987654321'])
            ->assertSessionHasErrors('privacy');

        $this->post(route('admission.store'), ['parent_name' => 'Bot', 'phone' => '987654321', 'privacy' => true, 'website' => 'spam.com']);

        $this->assertSame(0, Lead::count());
    }

    public function test_only_public_lessons_and_albums_appear_on_the_site(): void
    {
        $public = InductionLesson::create(['title' => 'Un día en Villa Jardín', 'audience' => 'parents', 'status' => ModuleStatus::Published, 'is_public' => true]);
        $public->blocks()->create(['type' => 'text', 'content' => ['body' => 'Hola'], 'position' => 0]);
        $public->blocks()->create(['type' => 'confirmation', 'content' => ['body' => 'Acepto'], 'position' => 1]);
        $private = InductionLesson::create(['title' => 'Reglamento interno', 'audience' => 'parents', 'status' => ModuleStatus::Published]);

        $this->get(route('videos'))->assertInertia(fn (Assert $page) => $page->has('lessons', 1)->where('lessons.0.title', 'Un día en Villa Jardín'));
        $this->get(route('videos.show', $public))->assertInertia(fn (Assert $page) => $page->has('lesson.blocks', 1));
        $this->get(route('videos.show', $private))->assertNotFound();

        $classroom = Classroom::where('slug', 'patitos')->firstOrFail();
        $album = Album::create(['classroom_id' => $classroom->id, 'title' => 'Navidad', 'date' => today(), 'published' => true, 'consent_confirmed_at' => now()]);
        $album->items()->create(['media_id' => Media::create(['public_id' => "vj/salones/{$classroom->id}/n", 'resource_type' => 'image', 'delivery_type' => 'authenticated'])->id]);

        $this->get(route('photos.show', $album))->assertNotFound();

        $this->actingAs($this->admin())
            ->post(route('gallery.public', $album), ['is_public' => true])
            ->assertSessionHasErrors('consent_confirmed');

        $this->actingAs($this->admin())
            ->post(route('gallery.public', $album), ['is_public' => true, 'consent_confirmed' => true])
            ->assertSessionHasNoErrors();

        $this->get(route('photos'))->assertInertia(fn (Assert $page) => $page->has('albums', 1));
        $this->get(route('photos.show', $album))->assertOk()->assertInertia(fn (Assert $page) => $page->has('album.items', 1));

        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $this->actingAs($teacher)->post(route('gallery.public', $album), ['is_public' => false])->assertForbidden();
    }
}
