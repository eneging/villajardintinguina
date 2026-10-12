<?php

namespace Tests\Feature;

use App\Enums\PaymentStatus;
use App\Mail\PaymentReminder;
use App\Models\Charge;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\Media;
use App\Models\Payment;
use App\Models\Reminder;
use App\Models\Student;
use App\Models\User;
use App\Services\BillingService;
use App\Services\CloudinaryService;
use Carbon\CarbonImmutable;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $parent;

    private Student $sofia;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-10-15 09:00'));
        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
        $this->parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
        $this->sofia = Student::where('dni', '90000001')->firstOrFail();
        $this->app->instance(CloudinaryService::class, new CloudinaryService('demo', 'key', 'secret', 'vj'));
    }

    private function billing(): BillingService
    {
        return app(BillingService::class);
    }

    public function test_monthly_charges_apply_discount_and_are_not_duplicated(): void
    {
        Enrollment::where('student_id', $this->sofia->id)->update(['monthly_fee' => 400, 'discount_pct' => 10]);

        $this->assertSame(1, $this->billing()->generateMonthly('2026-10'));
        $this->assertSame(0, $this->billing()->generateMonthly('2026-10'));

        $charge = Charge::firstOrFail();
        $this->assertEquals(360, $charge->amount);
        $this->assertSame('2026-10-10', $charge->due_on->toDateString());
        $this->assertSame('Mensualidad Octubre 2026', $charge->description);
    }

    public function test_admin_payment_covers_several_months_oldest_first(): void
    {
        $this->billing()->generateMonthly('2026-09');
        $this->billing()->generateMonthly('2026-10');
        $charges = Charge::orderBy('due_on')->get();

        $this->actingAs($this->admin)
            ->post(route('admin.billing.payments.store'), [
                'charge_ids' => $charges->pluck('id')->all(),
                'amount' => 500,
                'paid_on' => '2026-10-14',
                'method' => 'efectivo',
                'receipt_type' => 'boleta',
                'receipt_number' => 'B001-000123',
            ])
            ->assertSessionHasNoErrors();

        $charges = Charge::withPaidAmount()->orderBy('due_on')->get();
        $this->assertSame('pagada', $charges[0]->status());
        $this->assertSame(200.0, $charges[1]->balance());
        $this->assertSame('vencida', $charges[1]->status());

        $payment = Payment::firstOrFail();
        $this->assertSame($this->parent->id, $payment->payer_id);
        $this->assertSame(PaymentStatus::Confirmed, $payment->status);
    }

    public function test_payment_cannot_exceed_debt(): void
    {
        $this->billing()->generateMonthly('2026-10');

        $this->actingAs($this->admin)
            ->post(route('admin.billing.payments.store'), [
                'charge_ids' => [Charge::firstOrFail()->id],
                'amount' => 999,
                'paid_on' => '2026-10-14',
                'method' => 'yape',
            ])
            ->assertSessionHasErrors('amount');

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_parent_reports_voucher_and_admin_confirms(): void
    {
        $this->billing()->generateMonthly('2026-10');
        $charge = Charge::firstOrFail();
        $voucher = Media::create(['public_id' => "vj/pagos/padres/{$this->parent->id}/yape", 'resource_type' => 'image', 'delivery_type' => 'authenticated', 'format' => 'jpg']);

        $this->actingAs($this->parent)
            ->post(route('payments.store'), [
                'charge_ids' => [$charge->id],
                'amount' => 350,
                'paid_on' => '2026-10-14',
                'method' => 'yape',
                'operation_number' => '123456',
                'voucher_media_id' => $voucher->id,
            ])
            ->assertSessionHasNoErrors();

        $payment = Payment::firstOrFail();
        $this->assertSame(PaymentStatus::Pending, $payment->status);
        $this->assertSame('vencida', Charge::withPaidAmount()->first()->status()); // aún no cuenta

        $this->actingAs($this->admin)->post(route('admin.billing.payments.confirm', $payment))->assertRedirect();

        $this->assertSame('pagada', Charge::withPaidAmount()->first()->status());
    }

    public function test_parent_cannot_pay_other_children_or_use_foreign_voucher(): void
    {
        $other = Student::create(['first_name' => 'Luis', 'last_name' => 'Ríos']);
        $ositos = Classroom::where('slug', 'ositos')->firstOrFail();
        $other->enrollments()->create(['classroom_id' => $ositos->id, 'school_year_id' => $ositos->school_year_id, 'monthly_fee' => 300]);
        $this->billing()->generateMonthly('2026-10');
        $otherCharge = Charge::where('student_id', $other->id)->firstOrFail();
        $ownCharge = Charge::where('student_id', $this->sofia->id)->firstOrFail();
        $foreignVoucher = Media::create(['public_id' => 'vj/pagos/padres/999/x', 'resource_type' => 'image', 'delivery_type' => 'authenticated']);
        $ownVoucher = Media::create(['public_id' => "vj/pagos/padres/{$this->parent->id}/ok", 'resource_type' => 'image', 'delivery_type' => 'authenticated']);

        $payload = ['amount' => 100, 'paid_on' => '2026-10-14', 'method' => 'yape', 'operation_number' => '1'];

        $this->actingAs($this->parent)
            ->post(route('payments.store'), [...$payload, 'charge_ids' => [$otherCharge->id], 'voucher_media_id' => $ownVoucher->id])
            ->assertForbidden();

        $this->actingAs($this->parent)
            ->post(route('payments.store'), [...$payload, 'charge_ids' => [$ownCharge->id], 'voucher_media_id' => $foreignVoucher->id])
            ->assertSessionHasErrors('voucher_media_id');

        $this->actingAs($this->parent)
            ->post(route('payments.store'), [...$payload, 'charge_ids' => [$ownCharge->id]])
            ->assertSessionHasErrors('voucher_media_id');
    }

    public function test_debtors_panel_and_reminder_log(): void
    {
        $this->billing()->generateMonthly('2026-10');

        $this->actingAs($this->admin)
            ->get(route('admin.billing.debtors'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/billing/debtors')
                ->has('debtors', 1)
                ->where('debtors.0.contact.name', 'Carmen Quispe')
                ->where('debtors.0.total', 350)
                ->where('debtors.0.max_days_late', 5)
                ->where('debtors.0.last_reminder_at', null));

        $this->actingAs($this->admin)
            ->post(route('admin.billing.remind', $this->parent), ['total' => 350, 'charge_ids' => [Charge::first()->id]])
            ->assertRedirect();

        $this->assertDatabaseHas('reminders', ['user_id' => $this->parent->id, 'kind' => 'payment']);
        $this->actingAs($this->parent)->get(route('admin.billing.debtors'))->assertForbidden();
    }

    public function test_parent_sees_own_account(): void
    {
        $this->billing()->generateMonthly('2026-10');

        $this->actingAs($this->parent)
            ->get(route('payments.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('payments/index')
                ->has('children', 1)
                ->where('children.0.charges.0.status', 'vencida'));
    }

    public function test_charge_with_payments_cannot_be_voided(): void
    {
        $this->billing()->generateMonthly('2026-10');
        $charge = Charge::firstOrFail();
        $this->billing()->registerPayment(['paid_on' => '2026-10-14', 'amount' => 100, 'method' => 'efectivo'], [$charge->id], $this->admin, PaymentStatus::Confirmed);

        $this->actingAs($this->admin)->post(route('admin.billing.charges.annul', $charge))->assertStatus(422);
        $this->assertNull($charge->fresh()->voided_at);
    }

    public function test_automatic_reminders_by_email_and_whatsapp_respect_interval(): void
    {
        Mail::fake();
        Http::fake(['graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.1']]])]);
        config(['services.whatsapp.token' => 't', 'services.whatsapp.phone_number_id' => '123', 'services.whatsapp.payment_template' => 'recordatorio_pago']);
        $this->parent->update(['phone' => '987 654 321']);
        $this->billing()->generateMonthly('2026-09');

        $this->artisan('morosos:recordar')->expectsOutputToContain('desactivados');
        Mail::assertNothingSent();

        $this->actingAs($this->admin)->post(route('admin.billing.remind-all'))->assertRedirect();

        Mail::assertSent(PaymentReminder::class, fn ($mail) => $mail->hasTo($this->parent->email));
        Http::assertSent(fn ($request) => $request['to'] === '51987654321' && $request['template']['name'] === 'recordatorio_pago');
        $this->assertSame(2, Reminder::count());

        // Dentro del intervalo no se vuelve a enviar.
        config(['school.auto_reminders' => true]);
        $this->artisan('morosos:recordar')->expectsOutputToContain('omitidos: 1');
        $this->assertSame(2, Reminder::count());
    }

    public function test_individual_and_bulk_extra_charges_do_not_collide_or_duplicate(): void
    {
        $this->actingAs($this->admin)->post(route('admin.billing.charges.store', $this->sofia), [
            'concept' => 'otro', 'description' => 'Uniforme', 'amount' => 80, 'due_on' => '2026-10-30',
        ])->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post(route('admin.billing.charges.store', $this->sofia), [
            'concept' => 'otro', 'description' => 'Paseo', 'amount' => 25, 'due_on' => '2026-10-30',
        ])->assertSessionHasNoErrors();

        $bulk = ['concept' => 'otro', 'description' => 'Materiales 2026', 'amount' => 120, 'due_on' => '2026-11-05'];
        $this->actingAs($this->admin)->post(route('admin.billing.charges.bulk'), $bulk)->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post(route('admin.billing.charges.bulk'), $bulk)->assertSessionHasNoErrors();

        $this->assertSame(1, Charge::where('description', 'Materiales 2026')->count());
        $this->assertSame(3, Charge::where('concept', 'otro')->count());

        $this->actingAs($this->admin)->get(route('admin.billing.index', ['period' => '2026-10']))
            ->assertInertia(fn (Assert $page) => $page->has('charges', 2));
    }
}
