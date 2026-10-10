<?php

namespace App\Models;

use App\Enums\ComplaintType;
use App\Support\PeruCalendar;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * Hoja del Libro de Reclamaciones. Una vez registrada no se modifica ni se
 * elimina: solo se le agrega la respuesta del colegio.
 */
#[Fillable([
    'year', 'sequence', 'code', 'type',
    'consumer_name', 'consumer_document_type', 'consumer_document_number', 'consumer_address', 'consumer_phone', 'consumer_email',
    'is_minor', 'guardian_name', 'guardian_document_number',
    'item_type', 'item_description', 'amount', 'detail', 'request',
    'response_due_on', 'response', 'responded_at', 'responded_by', 'ip_address', 'user_agent',
])]
class Complaint extends Model
{
    /** Campos que pueden cambiar después del registro. */
    private const RESPONSE_FIELDS = ['response', 'responded_at', 'responded_by', 'updated_at'];

    protected function casts(): array
    {
        return [
            'type' => ComplaintType::class,
            'is_minor' => 'boolean',
            'amount' => 'decimal:2',
            'response_due_on' => 'date',
            'responded_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function (Complaint $complaint) {
            $changed = array_diff(array_keys($complaint->getDirty()), self::RESPONSE_FIELDS);

            if ($changed !== [] || $complaint->getOriginal('responded_at') !== null) {
                throw new LogicException('Las hojas de reclamación no se modifican; solo se responden una vez.');
            }
        });

        static::deleting(function () {
            throw new LogicException('Las hojas de reclamación no se pueden eliminar.');
        });
    }

    /** @return BelongsTo<User, $this> */
    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by');
    }

    public function isAnswered(): bool
    {
        return $this->responded_at !== null;
    }

    public function businessDaysLeft(): int
    {
        return PeruCalendar::businessDaysUntil($this->response_due_on);
    }
}
