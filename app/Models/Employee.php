<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'name', 'dni', 'position', 'regime', 'pension_system', 'base_salary', 'bank', 'account_number', 'hired_on', 'active'])]
class Employee extends Model
{
    use Auditable;

    public const POSITIONS = [
        'maestra' => 'Maestra',
        'auxiliar' => 'Auxiliar',
        'practicante' => 'Practicante',
        'limpieza' => 'Limpieza',
        'cocina' => 'Cocina',
        'administracion' => 'Administración',
        'otro' => 'Otro',
    ];

    public const REGIMES = [
        'planilla' => 'Planilla',
        'honorarios' => 'Recibo por honorarios',
        'practicas' => 'Practicante (subvención)',
    ];

    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'hired_on' => 'date',
            'active' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<PayrollItem, $this> */
    public function payrollItems(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }
}
