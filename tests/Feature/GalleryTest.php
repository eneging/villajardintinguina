<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Album;
use App\Models\Classroom;
use App\Models\Media;
use App\Models\Student;
use App\Models\User;
use App\Services\CloudinaryService;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GalleryTest extends TestCase
{
    use RefreshDatabase;

    private Classroom $patitos;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->app->instance(CloudinaryService::class, new CloudinaryService('demo', 'key', 'secret', 'vj'));
        $this->patitos = Classroom::where('slug', 'patitos')->firstOrFail();
    }

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    private function photo(int $classroomId, string $name): Media
    {
        return Media::create(['public_id' => "vj/salones/{$classroomId}/{$name}", 'resource_type' => 'image', 'delivery_type' => 'authenticated', 'format' => 'jpg']);
    }

    private function albumWithPhotos(): Album
    {
        $teacher = $this->user('maestra@villajardin.test');

        $this->actingAs($teacher)
            ->post(route('gallery.store', $this->patitos), ['title' => 'Paseo a la granja', 'date' => today()->toDateString()])
            ->assertRedirect();

        $album = Album::sole();
        $this->actingAs($teacher)
            ->post(route('gallery.items.store', $album), ['media_ids' => [$this->photo($this->patitos->id, 'a')->id, $this->photo($this->patitos->id, 'b')->id]])
            ->assertSessionHasNoErrors();

        return $album;
    }

    public function test_teacher_creates_album_and_publishing_requires_consent_confirmation(): void
    {
        $album = $this->albumWithPhotos();
        $teacher = $this->user('maestra@villajardin.test');
        $parent = $this->user('padre@villajardin.test');

        // Borrador: la familia aún no lo ve.
        $this->actingAs($parent)->get(route('gallery.show', $album))->assertForbidden();

        $this->actingAs($teacher)->post(route('gallery.publish', $album), ['published' => true])->assertSessionHasErrors('consent_confirmed');
        $this->actingAs($teacher)->post(route('gallery.publish', $album), ['published' => true, 'consent_confirmed' => true])->assertSessionHasNoErrors();

        $album->refresh();
        $this->assertTrue($album->published);
        $this->assertSame($teacher->id, $album->consent_confirmed_by);

        $this->actingAs($parent)
            ->get(route('gallery.show', $album))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('items', 2)
                ->where('canManage', false)
                ->where('withoutConsent', [])
                ->where('items.0.download_url', fn ($url) => str_contains($url, '/fl_attachment/')));

        $this->actingAs($parent)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->has('latestAlbums', 1)->where('latestAlbums.0.items_count', 2));
    }

    public function test_manager_sees_students_without_image_consent(): void
    {
        $album = $this->albumWithPhotos();
        $student = Student::create(['first_name' => 'Luis', 'last_name' => 'Sin Permiso', 'image_consent' => false]);
        $student->enrollments()->create(['classroom_id' => $this->patitos->id, 'school_year_id' => $this->patitos->school_year_id]);

        $this->actingAs($this->user('maestra@villajardin.test'))
            ->get(route('gallery.show', $album))
            ->assertInertia(fn (Assert $page) => $page->where('withoutConsent', ['Luis Sin Permiso']));
    }

    public function test_other_classrooms_and_roles_are_blocked(): void
    {
        $album = $this->albumWithPhotos();
        $album->update(['published' => true]);
        $ositos = Classroom::where('slug', 'ositos')->firstOrFail();

        $outsider = User::factory()->create();
        $outsider->assignRole(Role::Parent);
        $this->actingAs($outsider)->get(route('gallery.show', $album))->assertForbidden();
        $this->actingAs($outsider)->get(route('gallery.index', $this->patitos))->assertForbidden();

        // La practicante ve pero no edita; la maestra no sube archivos de otro salón.
        $intern = $this->user('practicante@villajardin.test');
        $this->actingAs($intern)->get(route('gallery.show', $album))->assertOk();
        $this->actingAs($intern)->post(route('gallery.store', $this->patitos), ['title' => 'x', 'date' => today()->toDateString()])->assertForbidden();

        $this->actingAs($this->user('maestra@villajardin.test'))
            ->post(route('gallery.items.store', $album), ['media_ids' => [$this->photo($ositos->id, 'ajena')->id]])
            ->assertSessionHasErrors('media_ids');

        $this->actingAs($this->user('maestra@villajardin.test'))->post(route('gallery.store', $ositos), ['title' => 'x', 'date' => today()->toDateString()])->assertForbidden();
    }

    public function test_deleting_photos_removes_them_from_cloudinary(): void
    {
        Http::fake(['api.cloudinary.com/*' => Http::response(['result' => 'ok'])]);
        $album = $this->albumWithPhotos();
        $teacher = $this->user('maestra@villajardin.test');
        $item = $album->items()->first();
        $mediaId = $item->media_id;

        $this->actingAs($teacher)->delete(route('gallery.items.destroy', $item))->assertRedirect();
        $this->assertSame(1, $album->items()->count());
        $this->assertSoftDeleted('media', ['id' => $mediaId]);

        $this->actingAs($teacher)->delete(route('gallery.destroy', $album))->assertRedirect(route('gallery.index', $this->patitos));
        $this->assertModelMissing($album);

        Http::assertSentCount(2);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/image/destroy') && $request['type'] === 'authenticated');
    }
}
