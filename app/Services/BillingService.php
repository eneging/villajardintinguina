<?php

namespace App\Services;

use App\Enums\ChargeConcept;
use App\Enums\PaymentStatus;
use App\Models\Charge;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Cobranza: genera mensualidades, aplica pagos a cuotas y calcula la morosidad.
 */
class BillingService
{
    /**
     * Crea la mensualidad del periodo (AAAA-MM) para cada alumno con matrícula activa.
     * Es idempotente: no duplica cuotas ya generadas.
     */
    public function generateMonthly(string $period, ?User $by = null): int
    {
        $month = CarbonImmutable::createFromFormat('!Y-m', $period);
        $year = SchoolYear::current();

        if (! $year) {
            return 0;
        }

        $dueOn = $month->setDay(min(config('school.fee_due_day'), $month->daysInMonth));
        $created = 0;

        Enrollment::query()
            ->where('school_year_id', $year->id)
            ->where('status', 'active')
            ->where('monthly_fee', '>', 0)
            ->each(function (Enrollment $enrollment) use ($period, $month, $dueOn, $by, &$created) {
                $charge = Charge::firstOrCreate(
                    ['enrollment_id' => $enrollment->id, 'concept' => ChargeConcept::Monthly, 'period' => $period],
                    [
                        'student_id' => $enrollment->student_id,
                        'description' => 'Mensualidad '.ucfirst($month->locale('es')->translatedFormat('F Y')),
                        'amount' => $this->monthlyAmount($enrollment),
                        'due_on' => $dueOn,
                        'created_by' => $by?->id,
                    ],
                );

                $created += $charge->wasRecentlyCreated ? 1 : 0;
            });

        return $created;
    }

    public function monthlyAmount(Enrollment $enrollment): float
    {
        return round((float) $enrollment->monthly_fee * (1 - (float) $enrollment->discount_pct / 100), 2);
    }

    /**
     * Registra un pago y lo reparte entre las cuotas elegidas, empezando por la más antigua.
     *
     * @param  array<string, mixed>  $data
     * @param  list<int>  $chargeIds
     */
    public function registerPayment(array $data, array $chargeIds, User $registeredBy, PaymentStatus $status): Payment
    {
        return DB::transaction(function () use ($data, $chargeIds, $registeredBy, $status) {
            $charges = Charge::query()
                ->active()
                ->withPaidAmount()
                ->whereKey($chargeIds)
                ->orderBy('due_on')
                ->lockForUpdate()
                ->get();

            $remaining = round((float) $data['amount'], 2);
            $outstanding = round($charges->sum(fn (Charge $charge) => max(0, $charge->balance())), 2);

            if ($charges->count() !== count(array_unique($chargeIds)) || $remaining <= 0 || $remaining > $outstanding) {
                throw new InvalidArgumentException('El monto no puede ser mayor que la deuda de las cuotas elegidas.');
            }

            $payment = Payment::create([
                ...$data,
                'status' => $status,
                'registered_by' => $registeredBy->id,
                'reviewed_by' => $status === PaymentStatus::Confirmed ? $registeredBy->id : null,
                'reviewed_at' => $status === PaymentStatus::Confirmed ? now() : null,
            ]);

            foreach ($charges as $charge) {
                $applied = min($remaining, max(0, $charge->balance()));

                if ($applied <= 0) {
                    continue;
                }

                $payment->allocations()->create(['charge_id' => $charge->id, 'amount' => $applied]);
                $remaining = round($remaining - $applied, 2);
            }

            return $payment;
        });
    }

    public function confirm(Payment $payment, User $by): void
    {
        DB::transaction(function () use ($payment, $by) {
            $payment->load('allocations.charge');

            // Si mientras tanto la cuota se pagó por otro medio, no se puede confirmar dos veces.
            foreach ($payment->allocations as $allocation) {
                if ($allocation->charge->balance() < (float) $allocation->amount) {
                    throw new InvalidArgumentException("La cuota «{$allocation->charge->description}» ya no tiene saldo suficiente.");
                }
            }

            $payment->update([
                'status' => PaymentStatus::Confirmed,
                'reviewed_by' => $by->id,
                'reviewed_at' => now(),
                'rejection_reason' => null,
            ]);
        });

        if ($payment->payer && $payment->payer_id !== $by->id) {
            app(Notifier::class)->send($payment->payer, 'payment', 'Pago confirmado', 'S/ '.number_format((float) $payment->amount, 2).' · ¡Gracias!', route('payments.index', absolute: false));
        }
    }

    public function reject(Payment $payment, User $by, string $reason): void
    {
        $payment->update([
            'status' => PaymentStatus::Rejected,
            'reviewed_by' => $by->id,
            'reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);

        if ($payment->payer) {
            app(Notifier::class)->send($payment->payer, 'payment', 'Voucher observado', $reason, route('payments.index', absolute: false), $by);
        }
    }

    /**
     * Apoderado responsable de pagos del alumno (o el primero registrado).
     */
    public function billingContact(Student $student): ?User
    {
        return $student->guardians->firstWhere('pivot.is_billing_contact', true)
            ?? $student->guardians->first();
    }

    /**
     * Familias con cuotas vencidas, agrupadas por el apoderado responsable de pagos.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function debtors(): Collection
    {
        $overdue = Charge::query()
            ->active()
            ->withPaidAmount()
            ->where('due_on', '<', today()->subDays(config('school.grace_days')))
            ->with(['student.guardians'])
            ->orderBy('due_on')
            ->get()
            ->filter(fn (Charge $charge) => $charge->balance() > 0);

        return $overdue
            ->groupBy(fn (Charge $charge) => $this->billingContact($charge->student)?->id ?? 0)
            ->map(function (Collection $charges, int $userId) {
                $contact = $userId ? $charges->first()->student->guardians->firstWhere('id', $userId) : null;

                return [
                    'contact' => $contact,
                    'charges' => $charges->values(),
                    'total' => round($charges->sum(fn (Charge $charge) => $charge->balance()), 2),
                    'max_days_late' => $charges->max(fn (Charge $charge) => $charge->daysLate()),
                ];
            })
            ->sortByDesc('total')
            ->values();
    }
}
