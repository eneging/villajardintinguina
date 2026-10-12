<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\OtherIncome;
use App\Models\Payment;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Planilla mensual (sueldo − faltas − tardanzas + bonos − descuentos − retenciones)
 * y balance de ingresos y egresos. Las retenciones son referenciales: confirmar con el contador.
 */
class PayrollService
{
    public function __construct(private readonly AttendanceService $attendance) {}

    /**
     * Crea (o recalcula, si sigue en borrador) la planilla del periodo.
     * Conserva los bonos, descuentos y notas que la administradora ya ingresó.
     */
    public function generate(string $period): PayrollRun
    {
        return DB::transaction(function () use ($period) {
            $run = PayrollRun::firstOrCreate(['period' => $period], ['status' => 'borrador']);

            if (! $run->isDraft()) {
                throw new InvalidArgumentException('La planilla ya fue aprobada; no se puede recalcular.');
            }

            $monthEnd = CarbonImmutable::createFromFormat('!Y-m', $period)->endOfMonth();
            $employees = Employee::query()
                ->where('active', true)
                ->where(fn ($q) => $q->whereNull('hired_on')->orWhere('hired_on', '<=', $monthEnd->toDateString()))
                ->with('user')
                ->get();

            $run->items()->whereNotIn('employee_id', $employees->pluck('id'))->delete();

            foreach ($employees as $employee) {
                $item = $run->items()->firstOrNew(['employee_id' => $employee->id]);
                $stats = $employee->user
                    ? $this->attendance->summaryFor($employee->user, $period, $employee->hired_on ? CarbonImmutable::parse($employee->hired_on) : null)
                    : ['absences' => 0, 'late_minutes' => 0];

                $item->fill([
                    'base_salary' => $employee->base_salary,
                    'absences' => $stats['absences'],
                    'late_minutes' => $stats['late_minutes'],
                ]);
                $this->calculate($item, $employee);
                $item->save();
            }

            $this->refreshTotal($run);

            return $run;
        });
    }

    public function updateItem(PayrollItem $item, float $bonuses, float $otherDeductions, int $absences, ?string $notes): void
    {
        if (! $item->run->isDraft()) {
            throw new InvalidArgumentException('La planilla ya fue aprobada.');
        }

        $item->fill([
            'bonuses' => $bonuses,
            'other_deductions' => $otherDeductions,
            'absences' => $absences,
            'notes' => $notes,
        ]);
        $this->calculate($item, $item->employee);
        $item->save();
        $this->refreshTotal($item->run);
    }

    public function approve(PayrollRun $run, User $by): void
    {
        if (! $run->isDraft()) {
            throw new InvalidArgumentException('La planilla ya fue aprobada.');
        }

        $run->update(['status' => 'aprobada', 'approved_by' => $by->id, 'approved_at' => now()]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function markPaid(PayrollItem $item, array $data): void
    {
        if ($item->run->isDraft()) {
            throw new InvalidArgumentException('Primero aprueba la planilla.');
        }

        $item->update($data);

        if ($item->run->items()->whereNull('paid_on')->doesntExist()) {
            $item->run->update(['status' => 'pagada']);
        }
    }

    public function calculate(PayrollItem $item, Employee $employee): void
    {
        $config = config('school.payroll');
        $base = (float) $item->base_salary;

        $absenceDeduction = round($base / $config['absence_divisor'] * $item->absences, 2);
        $lateDeduction = round($item->late_minutes * $config['late_deduction_per_minute'], 2);
        $earned = max(0, $base - $absenceDeduction - $lateDeduction + (float) $item->bonuses);

        [$label, $rate] = match (true) {
            $employee->regime === 'planilla' && $employee->pension_system === 'onp' => ['ONP '.$config['onp_rate'].'%', $config['onp_rate']],
            $employee->regime === 'planilla' && $employee->pension_system === 'afp' => ['AFP '.$config['afp_rate'].'%', $config['afp_rate']],
            $employee->regime === 'honorarios' && $earned > $config['fee_retention_threshold'] => ['Retención 4.ª cat. '.$config['fee_retention_rate'].'%', $config['fee_retention_rate']],
            default => [null, 0],
        };

        $retention = round($earned * $rate / 100, 2);

        $item->fill([
            'absence_deduction' => $absenceDeduction,
            'late_deduction' => $lateDeduction,
            'retention_label' => $label,
            'retention' => $retention,
            'net' => round(max(0, $earned - (float) $item->other_deductions - $retention), 2),
        ]);
    }

    /**
     * Balance de un mes: ingresos (pensiones confirmadas + otros) y egresos (planilla pagada + gastos).
     *
     * @return array<string, float|string>
     */
    public function balance(string $month): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);
        $range = [$start->toDateString(), $start->endOfMonth()->toDateString()];

        $tuition = (float) Payment::where('status', PaymentStatus::Confirmed)->whereBetween('paid_on', $range)->sum('amount');
        $other = (float) OtherIncome::whereBetween('date', $range)->sum('amount');
        $payroll = (float) PayrollItem::whereBetween('paid_on', $range)->sum('net');
        $expenses = (float) Expense::whereBetween('date', $range)->sum('amount');

        return [
            'month' => $month,
            'tuition' => round($tuition, 2),
            'other_income' => round($other, 2),
            'income' => round($tuition + $other, 2),
            'payroll' => round($payroll, 2),
            'expenses' => round($expenses, 2),
            'outflow' => round($payroll + $expenses, 2),
            'result' => round($tuition + $other - $payroll - $expenses, 2),
        ];
    }

    private function refreshTotal(PayrollRun $run): void
    {
        $run->update(['total_net' => $run->items()->sum('net')]);
    }
}
