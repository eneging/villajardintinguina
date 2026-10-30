<?php

namespace Tests\Feature;

use App\Models\AuthorizedPickup;
use App\Models\Classroom;
use App\Models\Incident;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\User;
use App\Support\Birthdays;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SafetyTest extends TestCase
{
    use RefreshDatabase;

    private Student $sofia;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->sofia = Student::where('dni', '90000001')->firstOrFail();
    }

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    public function test_incident_is_registered_notified_and_acknowledged_by_family(): void
    {
        $teacher = $this->user('maestra@villajardin.test');
        $parent = $this->user('padre@villajardin.test');

        $this->actingAs($teacher)->post(route('incidents.store'), [
            'student_id' => $this->sofia->id,
            'occurred_at' => now()->subHour()->format('Y-m-d H:i'),
            'type' => 'golpe',
            'description' => 'Se cayó en el patio y se golpeó la rodilla.',
            'action_taken' => 'Hielo y se avisó a la mamá.',
        ])->assertSessionHasNoErrors();

        $incident = Incident::sole();
        $this->assertSame(1, $parent->notifications()->where('data->kind', 'incident')->count());

        $this->actingAs($parent)->get(route('students.show', $this->sofia))->assertInertia(fn (Assert $page) => $page->has('incidents', 1));
        $this->actingAs($teacher)->post(route('incidents.acknowledge', $incident))->assertForbidden();
        $this->actingAs($parent)->post(route('incidents.acknowledge', $incident))->assertRedirect();
        $this->assertSame($parent->id, $incident->fresh()->acknowledged_by);

        // Un niño de otro salón no se puede registrar desde la maestra de Patitos.
        $other = Student::create(['first_name' => 'Otro', 'last_name' => 'Niño']);
        $other->enrollments()->create(['classroom_id' => Classroom::where('slug', 'ositos')->value('id'), 'school_year_id' => $this->sofia->currentEnrollment->school_year_id, 'monthly_fee' => 300]);
        $this->actingAs($teacher)->post(route('incidents.store'), ['student_id' => $other->id, 'occurred_at' => now()->format('Y-m-d H:i'), 'type' => 'otro', 'description' => 'x'])
            ->assertSessionHasErrors('student_id');

        $this->actingAs($parent)->get(route('incidents.index'))->assertForbidden();
    }

    public function test_qr_pickup_hands_over_child_and_records_attendance(): void
    {
        $parent = $this->user('padre@villajardin.test');
        $teacher = $this->user('maestra@villajardin.test');

        $codes = null;
        $this->actingAs($parent)->get(route('students.show', $this->sofia))->assertInertia(function (Assert $page) use (&$codes) {
            $codes = $page->toArray()['props']['pickupCodes'];
        });
        $this->assertCount(2, $codes); // la mamá y la abuela autorizada

        $pickup = AuthorizedPickup::where('dni', '21456789')->sole();
        $token = $pickup->pickup_token;
        $this->assertSame(32, strlen($token));

        $this->actingAs($parent)->get(route('pickups.scan', $token))->assertForbidden();

        $this->actingAs($teacher)->get(route('pickups.scan', $token))->assertInertia(fn (Assert $page) => $page
            ->component('pickups/scan')
            ->where('person.dni', '21456789')
            ->where('students.0.name', 'Sofía Quispe'));

        $this->actingAs($teacher)->post(route('pickups.hand-over', $token), ['student_id' => $this->sofia->id])->assertRedirect();

        $record = StudentAttendance::sole();
        $this->assertStringContainsString('Rosa Huamán', $record->picked_up_by);
        $this->assertNotNull($record->left_at);
        $this->assertSame(1, $parent->notifications()->where('data->kind', 'pickup')->count());

        // La abuela no puede recoger a un niño que no es suyo.
        $other = Student::create(['first_name' => 'Otro', 'last_name' => 'Niño']);
        $this->actingAs($teacher)->post(route('pickups.hand-over', $token), ['student_id' => $other->id])->assertStatus(422);

        $this->actingAs($teacher)->get(route('pickups.scan', str_repeat('x', 32)))->assertNotFound();
    }

    public function test_birthdays_of_the_week(): void
    {
        $this->sofia->update(['birth_date' => now()->subYears(4)->addDays(2)]);

        $birthdays = Birthdays::upcoming();
        $this->assertCount(1, $birthdays);
        $this->assertSame(4, $birthdays[0]['turns']);
        $this->assertSame(2, $birthdays[0]['days']);

        $this->sofia->update(['birth_date' => now()->subYears(4)->addDays(20)]);
        $this->assertCount(0, Birthdays::upcoming());

        $this->sofia->update(['birth_date' => now()->subYears(3)]);
        $this->artisan('cumpleanos:avisar')->expectsOutputToContain('Cumpleaños de hoy: 1');
        $this->assertSame(1, $this->user('maestra@villajardin.test')->notifications()->where('data->kind', 'birthday')->count());
    }
}
