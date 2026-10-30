<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['visit_slot_id', 'lead_id', 'parent_name', 'phone', 'email', 'child_name', 'notes', 'status', 'ip_address'])]
class VisitBooking extends Model
{
    public const STATUSES = ['confirmada' => 'Confirmada', 'asistio' => 'Asistió', 'no_asistio' => 'No asistió', 'cancelada' => 'Cancelada'];

    /** @return BelongsTo<Lead, $this> */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /** @return BelongsTo<VisitSlot, $this> */
    public function slot(): BelongsTo
    {
        return $this->belongsTo(VisitSlot::class, 'visit_slot_id');
    }
}
