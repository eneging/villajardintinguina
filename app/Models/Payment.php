<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'payer_id', 'paid_on', 'amount', 'method', 'operation_number', 'status',
    'voucher_media_id', 'receipt_type', 'receipt_number', 'receipt_media_id', 'notes',
    'registered_by', 'reviewed_by', 'reviewed_at', 'rejection_reason',
])]
class Payment extends Model
{
    protected function casts(): array
    {
        return [
            'paid_on' => 'date',
            'amount' => 'decimal:2',
            'method' => PaymentMethod::class,
            'status' => PaymentStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_id');
    }

    /** @return BelongsTo<User, $this> */
    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    /** @return HasMany<PaymentAllocation, $this> */
    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    /** @return BelongsTo<Media, $this> */
    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'voucher_media_id');
    }

    /** @return BelongsTo<Media, $this> */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'receipt_media_id');
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'paid_on' => $this->paid_on->toDateString(),
            'amount' => $this->amount,
            'method' => $this->method->value,
            'method_label' => $this->method->label(),
            'operation_number' => $this->operation_number,
            'status' => $this->status->value,
            'receipt_type' => $this->receipt_type,
            'receipt_number' => $this->receipt_number,
            'voucher' => $this->voucher?->toClient(),
            'receipt' => $this->receipt?->toClient(),
            'notes' => $this->notes,
            'rejection_reason' => $this->rejection_reason,
            'payer' => $this->payer?->name,
            'concepts' => $this->allocations->map(fn (PaymentAllocation $allocation) => $allocation->charge->description.' — '.$allocation->charge->student->first_name)->values(),
        ];
    }
}
