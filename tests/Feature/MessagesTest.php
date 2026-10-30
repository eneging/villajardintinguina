<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_family_and_teacher_exchange_messages_with_unread_state_and_quiet_notifications(): void
    {
        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $sofia = Student::where('dni', '90000001')->firstOrFail();

        $this->actingAs($parent)->post(route('messages.store', $sofia), ['body' => 'Buenos días, Sofía tiene tos.'])->assertRedirect();
        $this->actingAs($parent)->post(route('messages.store', $sofia), ['body' => '¿Pueden darle agua tibia?'])->assertRedirect();

        // Dos mensajes seguidos generan una sola notificación para la maestra.
        $this->assertSame(1, $teacher->notifications()->where('data->kind', 'message')->count());

        $this->actingAs($teacher)->get(route('messages.index'))->assertInertia(fn (Assert $page) => $page
            ->where('threads.0.name', 'Sofía Quispe')
            ->where('threads.0.unread', true));

        $this->actingAs($teacher)->get(route('messages.show', $sofia))->assertInertia(fn (Assert $page) => $page
            ->has('messages', 2)
            ->where('messages.0.body', 'Buenos días, Sofía tiene tos.')
            ->where('messages.1.body', '¿Pueden darle agua tibia?')
            ->where('messages.0.from_family', true));

        $this->actingAs($teacher)->get(route('messages.index'))->assertInertia(fn (Assert $page) => $page->where('threads.0.unread', false));

        $this->actingAs($teacher)->post(route('messages.store', $sofia), ['body' => 'Claro, la cuidamos.'])->assertRedirect();
        $this->assertSame(1, $parent->notifications()->where('data->kind', 'message')->count());
        $this->assertSame(3, Conversation::sole()->messages()->count());

        $stranger = User::factory()->create();
        $this->actingAs($stranger)->get(route('messages.show', $sofia))->assertForbidden();
        $this->actingAs($stranger)->post(route('messages.store', $sofia), ['body' => 'Hola'])->assertForbidden();
        $this->actingAs($parent)->post(route('messages.store', $sofia), ['body' => ''])->assertSessionHasErrors('body');
    }
}
