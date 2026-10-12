<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['raffle_id', 'number', 'buyer_id', 'buyer_name', 'paid', 'paid_at', 'sold_by'])]
class RaffleTicket extends Model
{
    protected function casts(): array
    {
        return [
            'paid' => 'boolean',
            'paid_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Raffle, $this> */
    public function raffle(): BelongsTo
    {
        return $this->belongsTo(Raffle::class);
    }

    /** @return BelongsTo<User, $this> */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function holderName(): ?string
    {
        return $this->buyer?->name ?? $this->buyer_name;
    }
}
