<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['starts_at', 'capacity'])]
class VisitSlot extends Model
{
    protected function casts(): array
    {
        return ['starts_at' => 'datetime'];
    }

    /** @return HasMany<VisitBooking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(VisitBooking::class);
    }

    /** @return HasMany<VisitBooking, $this> */
    public function activeBookings(): HasMany
    {
        return $this->bookings()->where('status', '!=', 'cancelada');
    }
}
