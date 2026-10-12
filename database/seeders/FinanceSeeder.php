<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\OtherIncome;
use App\Models\User;
use App\Services\PayrollService;
use Illuminate\Database\Seeder;

/**
 * Trabajadores, planilla del mes anterior pagada y algunos gastos (solo desarrollo).
 */
class FinanceSeeder extends Seeder
{
    public function run(PayrollService $payroll): void
    {
        if (Employee::query()->exists()) {
            return;
        }

        $teacher = User::where('email', 'maestra@villajardin.test')->first();
        $intern = User::where('email', 'practicante@villajardin.test')->first();
        $admin = User::where('email', 'admin@villajardin.test')->first();

        Employee::create(['user_id' => $teacher?->id, 'name' => 'Rosa Medina (Miss Rosa)', 'dni' => '40111222', 'position' => 'maestra', 'regime' => 'planilla', 'pension_system' => 'onp', 'base_salary' => 1800, 'bank' => 'BCP', 'account_number' => '191-00000000-0-01', 'hired_on' => now()->startOfYear()]);
        Employee::create(['user_id' => $intern?->id, 'name' => 'Lucía Torres (practicante)', 'position' => 'practicante', 'regime' => 'practicas', 'base_salary' => 1130, 'hired_on' => now()->startOfYear()]);
        Employee::create(['name' => 'Juana Pérez', 'position' => 'limpieza', 'regime' => 'honorarios', 'base_salary' => 1200, 'hired_on' => now()->startOfYear()]);

        $previous = now()->subMonthNoOverflow()->format('Y-m');
        $run = $payroll->generate($previous);

        // Mes anterior: sin registros de asistencia de prueba, se asume asistencia completa.
        foreach ($run->items as $item) {
            $payroll->updateItem($item, 0, 0, 0, null);
        }

        if ($admin) {
            $payroll->approve($run->fresh(), $admin);

            foreach ($run->items()->get() as $item) {
                $payroll->markPaid($item, ['paid_on' => now()->subMonthNoOverflow()->endOfMonth(), 'payment_method' => 'transferencia']);
            }
        }

        $categories = ExpenseCategory::pluck('id', 'name');

        foreach ([0, 1] as $monthsAgo) {
            $date = now()->subMonthsNoOverflow($monthsAgo)->startOfMonth()->addDays(4);
            Expense::create(['expense_category_id' => $categories['Alquiler'], 'date' => $date, 'description' => 'Alquiler del local', 'amount' => 1500, 'method' => 'transferencia', 'created_by' => $admin?->id]);
            Expense::create(['expense_category_id' => $categories['Luz'], 'date' => $date->addDays(6), 'description' => 'Recibo de luz', 'amount' => 180.5, 'method' => 'yape', 'created_by' => $admin?->id]);
            Expense::create(['expense_category_id' => $categories['Materiales educativos'], 'date' => $date->addDays(8), 'description' => 'Plastilina, témperas y papelógrafos', 'amount' => 240, 'method' => 'efectivo', 'created_by' => $admin?->id]);
        }

        OtherIncome::create(['date' => now()->subMonthNoOverflow()->startOfMonth()->addDays(20), 'source' => 'sorteo', 'description' => 'Sorteo por el Día del Niño', 'amount' => 650, 'created_by' => $admin?->id]);
    }
}
