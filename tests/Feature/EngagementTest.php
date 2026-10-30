<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Media;
use App\Models\Post;
use App\Models\Survey;
use App\Models\User;
use App\Models\VisitBooking;
use App\Models\VisitSlot;
use App\Services\CloudinaryService;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EngagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $parent;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->app->instance(CloudinaryService::class, new CloudinaryService('demo', 'key', 'secret', 'vj'));
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
        $this->parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
    }

    public function test_survey_is_published_answered_once_and_summarized(): void
    {
        $this->actingAs($this->admin)->post(route('admin.surveys.store'), [
            'title' => 'Satisfacción 2026',
            'audience' => 'parents',
            'anonymous' => true,
            'published' => true,
            'questions' => [
                ['label' => '¿Qué tan satisfecho estás?', 'type' => 'rating', 'required' => true],
                ['label' => '¿Nos recomendarías?', 'type' => 'choice', 'required' => true, 'options' => ['Sí', 'No']],
                ['label' => 'Comentarios', 'type' => 'text', 'required' => false],
            ],
        ])->assertSessionHasNoErrors();

        $survey = Survey::sole();
        [$rating, $choice, $text] = array_column($survey->questions, 'key');
        $this->assertSame(1, $this->parent->notifications()->where('data->kind', 'survey')->count());

        $this->actingAs($this->parent)->post(route('surveys.submit', $survey), ['answers' => [$rating => 7, $choice => 'Quizás']])
            ->assertSessionHasErrors(["answers.{$rating}", "answers.{$choice}"]);

        $this->actingAs($this->parent)->post(route('surveys.submit', $survey), ['answers' => [$rating => 4, $choice => 'Sí', $text => 'Más talleres de arte']])
            ->assertRedirect(route('surveys.index'));
        $this->actingAs($this->parent)->post(route('surveys.submit', $survey), ['answers' => [$rating => 5, $choice => 'Sí']])->assertStatus(422);

        $this->actingAs($this->admin)->get(route('admin.surveys.results', $survey))->assertInertia(fn (Assert $page) => $page
            ->where('total', 1)
            ->where('questions.0.average', 4)
            ->where('questions.1.distribution.Sí', 1)
            ->where('questions.2.texts.0.author', null));

        // Una encuesta solo para el personal no la ve la familia.
        $staffOnly = Survey::create(['title' => 'Clima laboral', 'audience' => 'staff', 'questions' => $survey->questions, 'published' => true]);
        $this->actingAs($this->parent)->get(route('surveys.show', $staffOnly))->assertNotFound();
    }

    public function test_news_publication_and_public_pages(): void
    {
        $cover = Media::create(['public_id' => 'vj/sitio/portada', 'resource_type' => 'image', 'delivery_type' => 'authenticated']);

        $this->actingAs($this->admin)->post(route('admin.posts.store'), ['title' => 'Día del Niño', 'body' => "Celebramos.\n\nHubo juegos.", 'cover_media_id' => $cover->id, 'published' => false])->assertRedirect();
        $post = Post::sole();
        $this->assertSame('dia-del-nino', $post->slug);
        $this->get(route('news.show', $post))->assertNotFound();

        $this->actingAs($this->admin)->put(route('admin.posts.update', $post->id), ['title' => 'Día del Niño', 'body' => 'Celebramos.', 'published' => true])->assertRedirect();
        $this->get(route('news'))->assertInertia(fn (Assert $page) => $page->has('posts.data', 1));
        $this->get(route('news.show', $post))->assertOk();
        $this->get('/')->assertInertia(fn (Assert $page) => $page->has('posts', 1));

        $this->actingAs($this->admin)->post(route('admin.posts.store'), ['title' => 'Día del Niño', 'body' => 'Otra', 'published' => true]);
        $this->assertSame('dia-del-nino-2', Post::latest('id')->value('slug'));

        $voucher = Media::create(['public_id' => 'vj/pagos/x', 'resource_type' => 'image', 'delivery_type' => 'authenticated']);
        $this->actingAs($this->admin)->post(route('admin.posts.store'), ['title' => 'X', 'body' => 'Y', 'cover_media_id' => $voucher->id])->assertSessionHasErrors('cover_media_id');
    }

    public function test_families_book_visits_within_capacity_and_create_leads(): void
    {
        $this->actingAs($this->admin)->post(route('admin.visits.slots.store'), [
            'from' => today()->addDay()->toDateString(),
            'to' => today()->addDays(7)->toDateString(),
            'weekdays' => [1, 2, 3, 4, 5],
            'times' => ['10:00'],
            'capacity' => 1,
        ])->assertSessionHasNoErrors();

        $this->assertSame(5, VisitSlot::count());
        $slot = VisitSlot::orderBy('starts_at')->first();

        $this->get(route('visit'))->assertInertia(fn (Assert $page) => $page->has('slots', 5));

        $booking = ['visit_slot_id' => $slot->id, 'parent_name' => 'Ana Pérez', 'phone' => '987654321', 'child_name' => 'Lucas', 'privacy' => true];
        $this->post(route('visit.store'), $booking)->assertRedirect(route('visit'));
        $this->post(route('visit.store'), [...$booking, 'parent_name' => 'Otra familia'])->assertSessionHasErrors('visit_slot_id');

        $this->assertSame(1, VisitBooking::count());
        $this->assertSame('visita', Lead::sole()->status);
        $this->get(route('visit'))->assertInertia(fn (Assert $page) => $page->has('slots', 4));

        $this->actingAs($this->admin)->delete(route('admin.visits.slots.destroy', $slot))->assertStatus(422);
        $this->actingAs($this->admin)->put(route('admin.visits.bookings.update', VisitBooking::sole()), ['status' => 'asistio'])->assertRedirect();
    }
}
