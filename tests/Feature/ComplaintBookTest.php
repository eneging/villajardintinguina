<?php

namespace Tests\Feature;

use App\Mail\ComplaintAnswered;
use App\Mail\ComplaintDeadlines;
use App\Mail\ComplaintReceived;
use App\Models\Complaint;
use App\Models\User;
use App\Support\PeruCalendar;
use Carbon\CarbonImmutable;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use LogicException;
use Tests\TestCase;

class ComplaintBookTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return [
            'type' => 'reclamo',
            'consumer_name' => 'Rosa Huamán',
            'consumer_document_type' => 'DNI',
            'consumer_document_number' => '45678912',
            'consumer_address' => 'Av. San Martín 123, Ica',
            'consumer_phone' => '987654321',
            'consumer_email' => 'rosa@example.com',
            'is_minor' => false,
            'item_type' => 'servicio',
            'item_description' => 'Mensualidad de octubre',
            'amount' => '350',
            'detail' => 'Se me cobró dos veces la pensión.',
            'request' => 'Devolución del cobro duplicado.',
            'accepted' => true,
            ...$overrides,
        ];
    }

    public function test_form_is_public(): void
    {
        $this->get(route('complaints.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('public/complaints/create')->has('provider.ruc'));
    }

    public function test_complaint_gets_correlative_code_deadline_and_email(): void
    {
        Mail::fake();
        $this->travelTo(CarbonImmutable::parse('2026-10-05 10:00')); // lunes; el 8 de octubre es feriado

        $response = $this->post(route('complaints.store'), $this->payload());
        $this->post(route('complaints.store'), $this->payload(['type' => 'queja']));

        $first = Complaint::orderBy('id')->firstOrFail();
        $this->assertSame('000001-2026', $first->code);
        $this->assertSame('000002-2026', Complaint::orderByDesc('id')->firstOrFail()->code);
        // 15 días hábiles desde el lunes 5, sin fines de semana ni el feriado del 8 → martes 27.
        $this->assertSame('2026-10-27', $first->response_due_on->toDateString());

        $response->assertRedirect();
        $this->assertStringContainsString('signature=', $response->headers->get('Location'));
        $this->get($response->headers->get('Location'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('complaint.code', '000001-2026'));

        Mail::assertSent(ComplaintReceived::class, fn ($mail) => $mail->hasTo('rosa@example.com'));
    }

    public function test_receipt_requires_signed_link(): void
    {
        Mail::fake();
        $this->post(route('complaints.store'), $this->payload());

        $this->get(route('complaints.receipt', Complaint::firstOrFail()))->assertForbidden();
    }

    public function test_validation_requires_guardian_for_minors_and_declaration(): void
    {
        $this->post(route('complaints.store'), $this->payload([
            'is_minor' => true,
            'accepted' => false,
            'consumer_document_number' => '123',
        ]))->assertSessionHasErrors(['guardian_name', 'guardian_document_number', 'accepted', 'consumer_document_number']);

        $this->assertDatabaseCount('complaints', 0);
    }

    public function test_complaints_cannot_be_edited_or_deleted(): void
    {
        Mail::fake();
        $this->post(route('complaints.store'), $this->payload());
        $complaint = Complaint::firstOrFail();

        try {
            $complaint->update(['detail' => 'otro texto']);
            $this->fail('Se permitió editar la hoja.');
        } catch (LogicException) {
        }

        $this->expectException(LogicException::class);
        $complaint->delete();
    }

    public function test_only_admin_can_answer_once(): void
    {
        Mail::fake();
        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->post(route('complaints.store'), $this->payload());
        $complaint = Complaint::firstOrFail();
        $admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();

        $this->actingAs($teacher)->get(route('admin.complaints.index'))->assertForbidden();

        $this->actingAs($admin)
            ->get(route('admin.complaints.index'))
            ->assertInertia(fn (Assert $page) => $page->has('complaints', 1)->where('complaints.0.answered', false));

        $this->actingAs($admin)
            ->post(route('admin.complaints.respond', $complaint), ['response' => 'Se verificó el doble cobro y se devolverá el monto.'])
            ->assertRedirect(route('admin.complaints.show', $complaint));

        $complaint->refresh();
        $this->assertNotNull($complaint->responded_at);
        $this->assertSame($admin->id, $complaint->responded_by);
        Mail::assertSent(ComplaintAnswered::class);

        $this->actingAs($admin)
            ->post(route('admin.complaints.respond', $complaint), ['response' => 'Cambio de respuesta posterior.'])
            ->assertStatus(409);
    }

    public function test_business_days_skip_weekends_and_holy_week(): void
    {
        // 2026: Jueves Santo 2 de abril, Viernes Santo 3 de abril.
        $this->assertFalse(PeruCalendar::isBusinessDay(CarbonImmutable::parse('2026-04-02')));
        $this->assertFalse(PeruCalendar::isBusinessDay(CarbonImmutable::parse('2026-04-03')));
        $this->assertSame('2026-04-06', PeruCalendar::addBusinessDays(CarbonImmutable::parse('2026-04-01'), 1)->toDateString());
        $this->assertSame(-1, PeruCalendar::businessDaysUntil(CarbonImmutable::parse('2026-04-01'), CarbonImmutable::parse('2026-04-06')));
    }

    public function test_deadline_alert_lists_complaints_due_soon(): void
    {
        Mail::fake();
        $this->travelTo(CarbonImmutable::parse('2026-10-05 10:00'));
        $this->post(route('complaints.store'), $this->payload());

        $this->artisan('reclamos:alertar-plazos')->assertSuccessful();
        Mail::assertNotSent(ComplaintDeadlines::class);

        $this->travelTo(CarbonImmutable::parse('2026-10-22 09:00')); // 3 días hábiles antes del 27
        $this->artisan('reclamos:alertar-plazos')->assertSuccessful();
        Mail::assertSent(ComplaintDeadlines::class, fn ($mail) => $mail->complaints->count() === 1);
    }
}
