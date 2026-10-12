<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['event_id', 'title', 'prize', 'ticket_price', 'total_tickets', 'draw_at', 'status', 'winner_ticket_id', 'seed', 'drawn_at', 'created_by'])]
class Raffle extends Model
{
    protected function casts(): array
    {
        return [
            'ticket_price' => 'decimal:2',
            'draw_at' => 'datetime',
            'drawn_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Event, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /** @return HasMany<RaffleTicket, $this> */
    public function tickets(): HasMany
    {
        return $this->hasMany(RaffleTicket::class)->orderBy('number');
    }

    /** @return BelongsTo<RaffleTicket, $this> */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(RaffleTicket::class, 'winner_ticket_id');
    }

    public function isDrawn(): bool
    {
        return $this->status === 'sorteado';
    }
}
