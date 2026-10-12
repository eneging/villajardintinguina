<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'date', 'status', 'check_in_at', 'check_out_at', 'late_minutes', 'latitude', 'longitude', 'ip_address', 'notes', 'recorded_by'])]
class StaffAttendance extends Model
{
    public const STATUSES = ['puntual', 'tardanza', 'falta', 'justificada'];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'check_in_at' => 'datetime',
            'check_out_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
