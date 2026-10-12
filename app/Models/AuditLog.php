<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * Registro de auditoría: solo se inserta, nunca se modifica ni se borra.
 */
#[Fillable(['user_id', 'event', 'auditable_type', 'auditable_id', 'old_values', 'new_values', 'ip_address'])]
class AuditLog extends Model
{
    public const UPDATED_AT = null;

    /** Nombre legible de cada modelo auditado. */
    public const LABELS = [
        'Payment' => 'Pago',
        'Charge' => 'Cuota',
        'PayrollRun' => 'Planilla',
        'PayrollItem' => 'Boleta de planilla',
        'Expense' => 'Gasto',
        'OtherIncome' => 'Otro ingreso',
        'Employee' => 'Trabajador',
        'Enrollment' => 'Matrícula',
        'Complaint' => 'Reclamo',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('La auditoría no se puede modificar.'));
        static::deleting(fn () => throw new LogicException('La auditoría no se puede borrar.'));
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
