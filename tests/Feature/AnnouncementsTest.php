<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Classroom;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AnnouncementsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
    }

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    public function test_audiences_and_permissions(): void
    {
        $admin = $this->user('admin@villajardin.test');
        $teacher = $this->user('maestra@villajardin.test');
        $parent = $this->user('padre@villajardin.test');
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $ositos = Classroom::where('slug', 'ositos')->firstOrFail();

        $this->actingAs($admin)->post(route('announcements.store'), ['classroom_id' => null, 'title' => 'Feriado', 'body' => 'No hay clases el lunes.'])->assertRedirect();
        $this->actingAs($teacher)->post(route('announcements.store'), ['classroom_id' => $patitos->id, 'title' => 'Paseo', 'body' => 'Traer gorro.'])->assertRedirect();
        $this->actingAs($admin)->post(route('announcements.store'), ['classroom_id' => $ositos->id, 'title' => 'Solo Ositos', 'body' => 'x'])->assertRedirect();

        // La maestra no puede escribir a todo el colegio ni a otro salón; el padre no publica.
        $this->actingAs($teacher)->post(route('announcements.store'), ['classroom_id' => null, 'title' => 'x', 'body' => 'x'])->assertForbidden();
        $this->actingAs($teacher)->post(route('announcements.store'), ['classroom_id' => $ositos->id, 'title' => 'x', 'body' => 'x'])->assertSessionHasErrors('classroom_id');
        $this->actingAs($parent)->post(route('announcements.store'), ['classroom_id' => $patitos->id, 'title' => 'x', 'body' => 'x'])->assertForbidden();

        $this->actingAs($parent)
            ->get(route('announcements.index'))
            ->assertInertia(fn (Assert $page) => $page->has('announcements', 2)->has('targets', 0));

        $this->actingAs($parent)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->has('announcements', 2));

        $mine = Announcement::where('title', 'Paseo')->firstOrFail();
        $this->actingAs($parent)->delete(route('announcements.destroy', $mine))->assertForbidden();
        $this->actingAs($teacher)->delete(route('announcements.destroy', $mine))->assertRedirect();
        $this->assertModelMissing($mine);
    }
}
