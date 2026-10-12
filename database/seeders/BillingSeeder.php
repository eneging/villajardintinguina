<?php

namespace Database\Seeders;

use App\Enums\ChargeConcept;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Charge;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Database\Seeder;

/**
 * Cuotas y pagos de ejemplo (solo desarrollo): meses anteriores pagados y el actual pendiente.
 */
class BillingSeeder extends Seeder
{
    public function run(BillingService $billing): void
    {
        $admin = User::where('email', 'admin@villajardin.test')->first();

        if (! $admin || Charge::query()->exists()) {
            return;
        }

        foreach (Enrollment::with('student.guardians')->get() as $enrollment) {
            $enrollment->charges()->create([
                'student_id' => $enrollment->student_id,
                'concept' => ChargeConcept::Enrollment,
                'description' => 'Matrícula '.now()->year,
                'amount' => 300,
                'due_on' => now()->setDate(now()->year, 2, 28),
            ]);
        }

        foreach (config('school.billing_months') as $month) {
            if ($month > now()->month) {
                break;
            }

            $billing->generateMonthly(sprintf('%d-%02d', now()->year, $month));
        }

        // Todo pagado excepto el mes actual.
        Charge::query()
            ->where(fn ($q) => $q->whereNull('period')->orWhere('period', '<', now()->format('Y-m')))
            ->with('student.guardians')
            ->get()
            ->each(fn (Charge $charge) => $billing->registerPayment([
                'payer_id' => $billing->billingContact($charge->student)?->id,
                'paid_on' => $charge->due_on->subDays(2),
                'amount' => $charge->amount,
                'method' => collect([PaymentMethod::Yape, PaymentMethod::Cash, PaymentMethod::Transfer])->random(),
                'receipt_type' => 'boleta',
                'receipt_number' => 'B001-'.str_pad((string) $charge->id, 6, '0', STR_PAD_LEFT),
            ], [$charge->id], $admin, PaymentStatus::Confirmed));
    }
}
