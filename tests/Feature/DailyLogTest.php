<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\DailyLog;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DailyLogTest extends TestCase
{
    use RefreshDatabase;

    private Classroom $patitos;

    private Student $sofia;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $this->sofia = Student::where('dni', '90000001')->firstOrFail();
    }

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    private function payload(array $overrides = []): array
    {
        return [
            'date' => today()->toDateString(),
            'meals' => [['moment' => 'refrigerio', 'amount' => 'todo']],
            'naps' => [['from' => '12:00', 'to' => '13:30']],
            'diapers' => [['time' => '10:15', 'type' => 'pipi']],
            'mood' => 'feliz',
            'note' => 'Jugó con plastilina.',
            'needs' => 'Pañales',
            ...$overrides,
        ];
    }

    public function test_teacher_saves_draft_then_sends_and_parent_is_notified_once(): void
    {
        $teacher = $this->user('maestra@villajardin.test');
        $parent = $this->user('padre@villajardin.test');
        $route = route('daily-logs.save', [$this->patitos, $this->sofia]);

        $this->actingAs($teacher)->put($route, $this->payload())->assertSessionHasNoErrors();
        $this->assertNull(DailyLog::sole()->sent_at);
        $this->assertSame(0, $parent->notifications()->count());

        // El padre no ve borradores.
        $this->actingAs($parent)->get(route('daily-logs.mine'))->assertInertia(fn (Assert $page) => $page->has('logs', 0));

        $this->actingAs($teacher)->put($route, $this->payload(['send' => true]))->assertSessionHasNoErrors();
        $this->actingAs($teacher)->put($route, $this->payload(['send' => true, 'note' => 'Corrección']))->assertSessionHasNoErrors();

        $this->assertSame(1, DailyLog::count());
        $this->assertSame(90, DailyLog::sole()->napMinutes());
        $this->assertSame(1, $parent->notifications()->count());

        $this->actingAs($parent)->get(route('daily-logs.mine'))->assertInertia(fn (Assert $page) => $page
            ->component('daily-logs/mine')
            ->has('logs', 1)
            ->where('logs.0.note', 'Corrección')
            ->where('logs.0.nap_minutes', 90));

        $this->actingAs($teacher)->get(route('daily-logs.classroom', $this->patitos))
            ->assertInertia(fn (Assert $page) => $page->where('students.0.log.mood', 'feliz'));
    }

    public function test_validation_and_permissions(): void
    {
        $teacher = $this->user('maestra@villajardin.test');
        $parent = $this->user('padre@villajardin.test');
        $route = route('daily-logs.save', [$this->patitos, $this->sofia]);

        $this->actingAs($teacher)->put($route, $this->payload(['naps' => [['from' => '13:00', 'to' => '12:00']], 'mood' => 'raro']))
            ->assertSessionHasErrors(['naps.0.to', 'mood']);

        $this->actingAs($parent)->put($route, $this->payload())->assertForbidden();
        $this->actingAs($parent)->get(route('daily-logs.classroom', $this->patitos))->assertForbidden();

        // Un alumno de otro salón no se puede registrar desde Patitos.
        $ositos = Classroom::where('slug', 'ositos')->firstOrFail();
        $this->actingAs($this->user('admin@villajardin.test'))->put(route('daily-logs.save', [$ositos, $this->sofia]), $this->payload())->assertNotFound();
    }
}
