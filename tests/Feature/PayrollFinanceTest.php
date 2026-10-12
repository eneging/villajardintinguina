<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\ExpenseCategory;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Models\StaffAttendance;
use App\Models\User;
use App\Services\AttendanceService;
use App\Services\PayrollService;
use Carbon\CarbonImmutable;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PayrollFinanceTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-11-02 09:00'));
        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
        $this->teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
    }

    private function employee(array $overrides = []): Employee
    {
        return Employee::create([
            'user_id' => $this->teacher->id,
            'name' => 'Miss Rosa',
            'position' => 'maestra',
            'regime' => 'planilla',
            'pension_system' => 'onp',
            'base_salary' => 1800,
            'hired_on' => '2026-10-01',
            ...$overrides,
        ]);
    }

    /** Asistencia de octubre 2026: 21 días hábiles (el 8 es feriado). */
    private function attendOctober(int $skip = 0, int $lateMinutes = 0): void
    {
        $days = app(AttendanceService::class)->businessDays('2026-10');

        foreach (array_slice($days, $skip) as $i => $day) {
            StaffAttendance::create([
                'user_id' => $this->teacher->id,
                'date' => $day,
                'status' => $i === 0 && $lateMinutes ? 'tardanza' : 'puntual',
                'late_minutes' => $i === 0 ? $lateMinutes : 0,
            ]);
        }
    }

    public function test_payroll_discounts_unjustified_absences_and_applies_onp(): void
    {
        $this->employee();
        $this->attendOctober(skip: 2);

        $this->actingAs($this->admin)->post(route('admin.payroll.generate'), ['period' => '2026-10'])->assertRedirect();

        $item = PayrollItem::sole();
        $this->assertSame(2, $item->absences);
        $this->assertEquals(120, $item->absence_deduction); // 1800 / 30 × 2
        $this->assertEquals(218.4, $item->retention); // 13% de 1680
        $this->assertEquals(1461.6, $item->net);
    }

    public function test_late_minutes_are_discounted_only_when_configured(): void
    {
        config(['school.payroll.late_deduction_per_minute' => 0.5]);
        $this->employee(['regime' => 'practicas', 'pension_system' => 'ninguno']);
        $this->attendOctober(lateMinutes: 30);

        $run = app(PayrollService::class)->generate('2026-10');
        $item = $run->items()->sole();

        $this->assertSame(30, $item->late_minutes);
        $this->assertEquals(15, $item->late_deduction);
        $this->assertEquals(1785, $item->net);
    }

    public function test_fee_retention_applies_above_threshold(): void
    {
        Employee::create(['name' => 'Contadora', 'position' => 'otro', 'regime' => 'honorarios', 'base_salary' => 2000]);
        Employee::create(['name' => 'Limpieza', 'position' => 'limpieza', 'regime' => 'honorarios', 'base_salary' => 1200]);

        $run = app(PayrollService::class)->generate('2026-10');
        $items = $run->items()->with('employee')->get()->keyBy('employee.name');

        $this->assertEquals(160, $items['Contadora']->retention);
        $this->assertEquals(0, $items['Limpieza']->retention);
        $this->assertEquals(3040, $run->fresh()->total_net);
    }

    public function test_bonuses_approval_payment_and_lock(): void
    {
        $this->employee(['regime' => 'practicas', 'pension_system' => 'ninguno']);
        $this->attendOctober();
        $run = app(PayrollService::class)->generate('2026-10');
        $item = $run->items()->sole();

        $this->actingAs($this->admin)
            ->put(route('admin.payroll.items.update', $item), ['bonuses' => 200, 'other_deductions' => 50, 'absences' => 0, 'notes' => 'Bono por actuación'])
            ->assertRedirect();
        $this->assertEquals(1950, $item->fresh()->net);

        // Regenerar conserva el bono.
        app(PayrollService::class)->generate('2026-10');
        $this->assertEquals(1950, $item->fresh()->net);

        $this->actingAs($this->admin)->post(route('admin.payroll.approve', $run))->assertRedirect();
        $this->actingAs($this->admin)
            ->put(route('admin.payroll.items.update', $item), ['bonuses' => 999, 'other_deductions' => 0, 'absences' => 0])
            ->assertStatus(409);

        $this->actingAs($this->admin)
            ->post(route('admin.payroll.items.pay', $item), ['paid_on' => '2026-10-31', 'payment_method' => 'transferencia', 'operation_number' => '0001'])
            ->assertRedirect();

        $this->assertSame('pagada', $run->fresh()->status);
    }

    public function test_staff_sees_only_own_approved_payslips(): void
    {
        $this->employee();
        $other = Employee::create(['name' => 'Otra', 'position' => 'cocina', 'regime' => 'honorarios', 'base_salary' => 1000]);
        $run = app(PayrollService::class)->generate('2026-10');
        $mine = $run->items()->where('employee_id', '!=', $other->id)->sole();
        $theirs = $run->items()->where('employee_id', $other->id)->sole();

        $this->actingAs($this->teacher)->get(route('payslips.show', $mine))->assertForbidden(); // aún en borrador

        app(PayrollService::class)->approve($run, $this->admin);

        $this->actingAs($this->teacher)->get(route('payslips.index'))->assertInertia(fn (Assert $page) => $page->has('items', 1));
        $this->actingAs($this->teacher)->get(route('payslips.show', $mine))->assertOk();
        $this->actingAs($this->teacher)->get(route('payslips.show', $theirs))->assertForbidden();
        $this->actingAs($this->teacher)->get(route('admin.payroll.index'))->assertForbidden();
    }

    public function test_balance_combines_income_and_expenses(): void
    {
        $category = ExpenseCategory::where('name', 'Alquiler')->firstOrFail();

        $this->actingAs($this->admin)->post(route('admin.finance.expenses.store'), [
            'expense_category_id' => $category->id, 'date' => '2026-10-05', 'description' => 'Alquiler', 'amount' => 1500, 'method' => 'transferencia',
        ])->assertRedirect();
        $this->actingAs($this->admin)->post(route('admin.finance.incomes.store'), [
            'date' => '2026-10-20', 'source' => 'sorteo', 'description' => 'Sorteo Halloween', 'amount' => 700,
        ])->assertRedirect();

        $balance = app(PayrollService::class)->balance('2026-10');
        $this->assertEquals(700, $balance['income']);
        $this->assertEquals(1500, $balance['outflow']);
        $this->assertEquals(-800, $balance['result']);

        $this->actingAs($this->admin)
            ->get(route('admin.finance.index', ['mes' => '2026-10']))
            ->assertInertia(fn (Assert $page) => $page->has('history', 12)->has('expenses', 1)->has('incomes', 1));

        $csv = $this->actingAs($this->admin)->get(route('admin.finance.download', ['mes' => '2026-10']))->streamedContent();
        $this->assertStringContainsString('2026-10;0,00;700,00;700,00;0,00;1500,00;1500,00;-800,00', $csv);
    }

    public function test_approved_payroll_cannot_be_regenerated(): void
    {
        $this->employee();
        $run = app(PayrollService::class)->generate('2026-10');
        app(PayrollService::class)->approve($run, $this->admin);

        $this->actingAs($this->admin)->post(route('admin.payroll.generate'), ['period' => '2026-10'])->assertSessionHasErrors('period');
        $this->assertSame(1, PayrollRun::count());
    }
}
