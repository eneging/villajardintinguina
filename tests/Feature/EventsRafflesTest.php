<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventSubmission;
use App\Models\OtherIncome;
use App\Models\Raffle;
use App\Models\RaffleTicket;
use App\Models\Student;
use App\Models\User;
use App\Services\RaffleService;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EventsRafflesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $parent;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
        $this->parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
    }

    private function createEvent(array $overrides = []): Event
    {
        $this->actingAs($this->admin)->post(route('admin.events.store'), [
            'title' => 'Día de la Madre',
            'date' => now()->addDays(10)->toDateString(),
            'theme' => ['color' => '#db2777', 'accent' => '#fce7f3', 'emoji' => '💐'],
            'per_student' => true,
            'registration_open' => true,
            'published' => true,
            'form_schema' => [
                ['label' => '¿Cuántas personas asistirán?', 'type' => 'number', 'required' => true],
                ['label' => 'Talla del polo', 'type' => 'select', 'required' => true, 'options' => ['S', 'M', 'L', '']],
                ['label' => 'Autorizo fotos', 'type' => 'checkbox', 'required' => false],
            ],
            ...$overrides,
        ])->assertRedirect();

        return Event::latest('id')->firstOrFail();
    }

    public function test_admin_builds_event_form_and_parent_answers_per_child(): void
    {
        $event = $this->createEvent();
        $this->assertCount(3, $event->form_schema);
        $this->assertSame(['S', 'M', 'L'], $event->form_schema[1]['options']);
        [$people, $size, $photos] = array_column($event->form_schema, 'key');
        $sofia = Student::where('dni', '90000001')->firstOrFail();

        $this->actingAs($this->parent)
            ->post(route('events.submit', $event), ['student_id' => $sofia->id, 'data' => [$people => 3, $size => 'XL']])
            ->assertSessionHasErrors("data.{$size}");

        $this->actingAs($this->parent)
            ->post(route('events.submit', $event), ['student_id' => $sofia->id, 'data' => [$people => 3, $size => 'M', $photos => true]])
            ->assertSessionHasNoErrors();

        // Volver a responder actualiza la misma respuesta.
        $this->actingAs($this->parent)
            ->post(route('events.submit', $event), ['student_id' => $sofia->id, 'data' => [$people => 2, $size => 'M']]);

        $submission = EventSubmission::sole();
        $this->assertEquals(2, $submission->data[$people]);
        $this->assertFalse($submission->data[$photos]);

        $csv = $this->actingAs($this->admin)->get(route('admin.events.download', $event))->streamedContent();
        $this->assertStringContainsString('"Carmen Quispe";"Sofía Quispe";2;M;No', $csv);
    }

    public function test_parent_cannot_answer_for_other_children_or_unpublished_events(): void
    {
        $event = $this->createEvent();
        $other = Student::create(['first_name' => 'Ajeno', 'last_name' => 'Niño']);

        $this->actingAs($this->parent)
            ->post(route('events.submit', $event), ['student_id' => $other->id, 'data' => []])
            ->assertSessionHasErrors('student_id');

        $draft = $this->createEvent(['title' => 'Borrador', 'published' => false]);
        $this->actingAs($this->parent)->get(route('events.show', $draft))->assertNotFound();
        $this->actingAs($this->parent)->get(route('events.index'))->assertInertia(fn (Assert $page) => $page->has('events', 1));
    }

    public function test_raffle_tickets_draw_is_verifiable_and_income_is_recorded(): void
    {
        $event = $this->createEvent();

        $this->actingAs($this->admin)->post(route('admin.raffles.store'), [
            'event_id' => $event->id, 'title' => 'Gran sorteo', 'prize' => 'Canasta', 'ticket_price' => 5, 'total_tickets' => 50,
        ])->assertRedirect();

        $raffle = Raffle::sole();
        $this->assertSame(50, $raffle->tickets()->count());

        $tickets = $raffle->tickets()->whereIn('number', [3, 7, 21])->get();
        $this->actingAs($this->admin)->put(route('admin.raffles.tickets.assign', $tickets[0]), ['buyer_id' => $this->parent->id, 'paid' => true]);
        $this->actingAs($this->admin)->put(route('admin.raffles.tickets.assign', $tickets[1]), ['buyer_name' => 'Tío Pedro', 'paid' => true]);
        $this->actingAs($this->admin)->put(route('admin.raffles.tickets.assign', $tickets[2]), ['buyer_name' => 'Debe pagar', 'paid' => false]);

        $this->actingAs($this->admin)->post(route('admin.raffles.draw', $raffle))->assertRedirect(route('admin.raffles.live', $raffle));

        $raffle->refresh();
        $paid = $raffle->tickets()->where('paid', true)->orderBy('number')->get();
        $this->assertSame('sorteado', $raffle->status);
        $this->assertSame($paid[RaffleService::winnerIndex($raffle->seed, 2)]->id, $raffle->winner_ticket_id);
        $this->assertContains($raffle->winner->number, [3, 7]);

        $income = OtherIncome::sole();
        $this->assertEquals(10, $income->amount);
        $this->assertSame($raffle->id, $income->raffle_id);

        // No se puede volver a sortear ni cambiar tickets.
        $this->actingAs($this->admin)->post(route('admin.raffles.draw', $raffle))->assertSessionHasErrors('draw');
        $this->actingAs($this->admin)->put(route('admin.raffles.tickets.assign', $tickets[2]), ['buyer_name' => 'X', 'paid' => true])->assertSessionHasErrors('ticket');

        // La familia ve su ticket y el resultado con la semilla.
        $this->actingAs($this->parent)
            ->get(route('events.show', $event))
            ->assertInertia(fn (Assert $page) => $page
                ->where('raffles.0.my_tickets', [3])
                ->where('raffles.0.seed', $raffle->seed));
    }

    public function test_draw_requires_paid_tickets_and_admin(): void
    {
        $raffle = app(RaffleService::class)->create(['title' => 'Vacío', 'prize' => 'Algo', 'ticket_price' => 2, 'total_tickets' => 10], $this->admin);

        $this->actingAs($this->admin)->post(route('admin.raffles.draw', $raffle))->assertSessionHasErrors('draw');
        $this->actingAs($this->parent)->post(route('admin.raffles.draw', $raffle))->assertForbidden();
        $this->assertSame(0, RaffleTicket::where('paid', true)->count());
    }
}
