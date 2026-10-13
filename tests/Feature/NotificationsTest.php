<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationsTest extends TestCase
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

    public function test_classroom_announcement_notifies_its_families_but_not_the_author(): void
    {
        $teacher = $this->user('maestra@villajardin.test');
        $parent = $this->user('padre@villajardin.test');
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $outsider = User::factory()->create();

        $this->actingAs($teacher)->post(route('announcements.store'), ['classroom_id' => $patitos->id, 'title' => 'Paseo', 'body' => 'Traer gorro.'])->assertRedirect();

        $this->assertSame(1, $parent->unreadNotifications()->count());
        $this->assertSame(0, $teacher->notifications()->count());
        $this->assertSame(0, $outsider->notifications()->count());

        $this->actingAs($parent)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->where('notifications.unread', 1)
            ->where('notifications.latest.0.title', 'Comunicado del salón Patitos'));

        $notification = $parent->notifications()->first();
        $this->actingAs($parent)->get(route('notifications.open', $notification->id))->assertRedirect('/comunicados');
        $this->assertNotNull($notification->fresh()->read_at);

        // No se pueden abrir avisos de otra persona.
        $this->actingAs($outsider)->get(route('notifications.open', $notification->id))->assertNotFound();
    }

    public function test_admins_are_notified_of_new_leads_and_read_all(): void
    {
        Mail::fake();
        $admin = $this->user('admin@villajardin.test');

        $this->post(route('admission.store'), ['parent_name' => 'Lucía', 'phone' => '987654321', 'privacy' => true])->assertRedirect();
        $this->assertSame(1, $admin->unreadNotifications()->count());

        $this->actingAs($admin)->get(route('notifications.index'))->assertInertia(fn (Assert $page) => $page->has('notifications.data', 1));
        $this->actingAs($admin)->post(route('notifications.read-all'))->assertRedirect();
        $this->assertSame(0, $admin->unreadNotifications()->count());
    }
}
