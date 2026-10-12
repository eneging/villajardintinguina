<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/employees/index', [
            'employees' => Employee::query()->with('user')->orderByDesc('active')->orderBy('name')->get()->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'name' => $employee->name,
                'position' => Employee::POSITIONS[$employee->position] ?? $employee->position,
                'regime' => Employee::REGIMES[$employee->regime] ?? $employee->regime,
                'base_salary' => (float) $employee->base_salary,
                'active' => $employee->active,
                'has_account' => $employee->user_id !== null,
            ]),
        ]);
    }

    public function create(): Response
    {
        return $this->form();
    }

    public function store(Request $request): RedirectResponse
    {
        Employee::create($this->validated($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Trabajador registrado.']);

        return to_route('admin.employees.index');
    }

    public function edit(Employee $employee): Response
    {
        return $this->form($employee);
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $employee->update($this->validated($request, $employee));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Datos actualizados.']);

        return to_route('admin.employees.index');
    }

    private function form(?Employee $employee = null): Response
    {
        return Inertia::render('admin/employees/form', [
            'employee' => $employee ? [
                ...$employee->only(['id', 'user_id', 'name', 'dni', 'position', 'regime', 'pension_system', 'bank', 'account_number', 'active']),
                'base_salary' => (string) $employee->base_salary,
                'hired_on' => $employee->hired_on?->toDateString(),
            ] : null,
            'positions' => self::options(Employee::POSITIONS),
            'regimes' => self::options(Employee::REGIMES),
            'accounts' => User::query()
                ->whereHas('roleAssignments', fn ($q) => $q->whereIn('role', [Role::Teacher->value, Role::Intern->value, Role::Admin->value]))
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => ['value' => $user->id, 'label' => $user->name]),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Employee $employee = null): array
    {
        return $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id', Rule::unique('employees', 'user_id')->ignore($employee)],
            'name' => ['required', 'string', 'max:150'],
            'dni' => ['nullable', 'string', 'max:12'],
            'position' => ['required', Rule::in(array_keys(Employee::POSITIONS))],
            'regime' => ['required', Rule::in(array_keys(Employee::REGIMES))],
            'pension_system' => ['required', 'in:onp,afp,ninguno'],
            'base_salary' => ['required', 'numeric', 'min:0', 'max:99999'],
            'bank' => ['nullable', 'string', 'max:50'],
            'account_number' => ['nullable', 'string', 'max:40'],
            'hired_on' => ['nullable', 'date'],
            'active' => ['boolean'],
        ], [], [
            'user_id' => 'cuenta',
            'name' => 'nombre',
            'base_salary' => 'sueldo',
        ]);
    }

    /**
     * @param  array<string, string>  $map
     * @return list<array{value: string, label: string}>
     */
    public static function options(array $map): array
    {
        return collect($map)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values()->all();
    }
}
