<?php

namespace App\Models;

use App\Enums\ChargeConcept;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property float|null $paid_amount Suma de pagos confirmados (con withPaidAmount()).
 * @property float|null $pending_amount Suma de pagos por verificar (con withPaidAmount()).
 */
#[Fillable(['enrollment_id', 'student_id', 'concept', 'description', 'period', 'amount', 'due_on', 'voided_at', 'created_by'])]
class Charge extends Model
{
    protected function casts(): array
    {
        return [
            'concept' => ChargeConcept::class,
            'amount' => 'decimal:2',
            'due_on' => 'date',
            'voided_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Enrollment, $this> */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return HasMany<PaymentAllocation, $this> */
    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    /**
     * Agrega paid_amount (confirmado) y pending_amount (por verificar).
     *
     * @param  Builder<Charge>  $query
     */
    public function scopeWithPaidAmount(Builder $query): void
    {
        $query->withSum(['allocations as paid_amount' => fn (Builder $q) => $q->whereHas(
            'payment',
            fn (Builder $payment) => $payment->where('status', PaymentStatus::Confirmed),
        )], 'amount')->withSum(['allocations as pending_amount' => fn (Builder $q) => $q->whereHas(
            'payment',
            fn (Builder $payment) => $payment->where('status', PaymentStatus::Pending),
        )], 'amount');
    }

    /**
     * @param  Builder<Charge>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('voided_at');
    }

    public function balance(): float
    {
        return round((float) $this->amount - (float) ($this->paid_amount ?? $this->allocations()
            ->whereHas('payment', fn ($q) => $q->where('status', PaymentStatus::Confirmed))
            ->sum('amount')), 2);
    }

    /**
     * pagada | parcial | vencida | pendiente | anulada
     */
    public function status(): string
    {
        if ($this->voided_at) {
            return 'anulada';
        }

        $balance = $this->balance();

        if ($balance <= 0) {
            return 'pagada';
        }

        if ($this->isOverdue()) {
            return 'vencida';
        }

        return $balance < (float) $this->amount ? 'parcial' : 'pendiente';
    }

    public function isOverdue(): bool
    {
        return ! $this->voided_at
            && $this->balance() > 0
            && $this->due_on->copy()->addDays(config('school.grace_days'))->lt(today());
    }

    public function daysLate(): int
    {
        return $this->isOverdue() ? (int) $this->due_on->diffInDays(today()) : 0;
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'concept' => $this->concept->value,
            'description' => $this->description,
            'period' => $this->period,
            'amount' => (float) $this->amount,
            'paid' => (float) ($this->paid_amount ?? 0),
            'pending' => (float) ($this->pending_amount ?? 0),
            'balance' => $this->balance(),
            'due_on' => $this->due_on->toDateString(),
            'status' => $this->status(),
            'days_late' => $this->daysLate(),
        ];
    }
}
