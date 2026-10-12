<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'payroll_run_id', 'employee_id', 'base_salary', 'absences', 'absence_deduction', 'late_minutes', 'late_deduction',
    'bonuses', 'other_deductions', 'retention_label', 'retention', 'net', 'paid_on', 'payment_method', 'operation_number',
    'voucher_media_id', 'notes',
])]
class PayrollItem extends Model
{
    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'absence_deduction' => 'decimal:2',
            'late_deduction' => 'decimal:2',
            'bonuses' => 'decimal:2',
            'other_deductions' => 'decimal:2',
            'retention' => 'decimal:2',
            'net' => 'decimal:2',
            'paid_on' => 'date',
        ];
    }

    /** @return BelongsTo<PayrollRun, $this> */
    public function run(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /** @return BelongsTo<Media, $this> */
    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'voucher_media_id');
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'employee' => [
                'id' => $this->employee->id,
                'name' => $this->employee->name,
                'dni' => $this->employee->dni,
                'position' => Employee::POSITIONS[$this->employee->position] ?? $this->employee->position,
                'regime' => Employee::REGIMES[$this->employee->regime] ?? $this->employee->regime,
                'bank' => $this->employee->bank,
                'account_number' => $this->employee->account_number,
            ],
            'base_salary' => (float) $this->base_salary,
            'absences' => $this->absences,
            'absence_deduction' => (float) $this->absence_deduction,
            'late_minutes' => $this->late_minutes,
            'late_deduction' => (float) $this->late_deduction,
            'bonuses' => (float) $this->bonuses,
            'other_deductions' => (float) $this->other_deductions,
            'retention_label' => $this->retention_label,
            'retention' => (float) $this->retention,
            'net' => (float) $this->net,
            'paid_on' => $this->paid_on?->toDateString(),
            'payment_method' => $this->payment_method,
            'operation_number' => $this->operation_number,
            'voucher' => $this->voucher?->toClient(),
            'notes' => $this->notes,
        ];
    }
}
