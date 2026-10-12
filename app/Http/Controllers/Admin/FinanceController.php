<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Media;
use App\Models\OtherIncome;
use App\Services\CloudinaryService;
use App\Services\PayrollService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Gastos, otros ingresos y balance mensual.
 */
class FinanceController extends Controller
{
    public function __construct(private readonly PayrollService $payroll) {}

    public function index(Request $request): Response
    {
        $month = $request->validate(['mes' => ['nullable', 'date_format:Y-m']])['mes'] ?? today()->format('Y-m');
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);
        $range = [$start->toDateString(), $start->endOfMonth()->toDateString()];

        return Inertia::render('admin/finance/index', [
            'month' => $month,
            'balance' => $this->payroll->balance($month),
            'history' => collect(range(11, 0))->map(fn ($i) => $this->payroll->balance($start->subMonthsNoOverflow($i)->format('Y-m')))->values(),
            'expenses' => Expense::query()->with(['category', 'receipt'])->whereBetween('date', $range)->orderByDesc('date')->get()->map(fn (Expense $expense) => [
                'id' => $expense->id,
                'date' => $expense->date->toDateString(),
                'category' => $expense->category->name,
                'description' => $expense->description,
                'amount' => (float) $expense->amount,
                'method' => $expense->method,
                'receipt' => $expense->receipt?->toClient(),
            ]),
            'incomes' => OtherIncome::query()->whereBetween('date', $range)->orderByDesc('date')->get()->map(fn (OtherIncome $income) => [
                'id' => $income->id,
                'date' => $income->date->toDateString(),
                'source' => OtherIncome::SOURCES[$income->source] ?? $income->source,
                'description' => $income->description,
                'amount' => (float) $income->amount,
            ]),
            'categories' => ExpenseCategory::orderBy('name')->get()->map(fn ($c) => ['value' => $c->id, 'label' => $c->name]),
            'sources' => EmployeeController::options(OtherIncome::SOURCES),
            'methods' => PaymentMethod::options(),
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    public function storeExpense(Request $request, CloudinaryService $cloudinary): RedirectResponse
    {
        $data = $request->validate([
            'expense_category_id' => ['required', 'exists:expense_categories,id'],
            'date' => ['required', 'date', 'before_or_equal:today'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'receipt_media_id' => ['nullable', 'integer', 'exists:media,id'],
        ], [], ['expense_category_id' => 'categoría', 'description' => 'descripción', 'amount' => 'monto']);

        if (! empty($data['receipt_media_id']) && ! $cloudinary->belongsToFolder(Media::find($data['receipt_media_id'])->public_id, 'pagos')) {
            throw ValidationException::withMessages(['receipt_media_id' => 'Archivo no válido.']);
        }

        Expense::create([...$data, 'created_by' => $request->user()->id]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Gasto registrado.']);

        return back();
    }

    public function destroyExpense(Expense $expense): RedirectResponse
    {
        $expense->delete();

        return back();
    }

    public function storeIncome(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'source' => ['required', Rule::in(array_keys(OtherIncome::SOURCES))],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999'],
        ], [], ['description' => 'descripción', 'amount' => 'monto']);

        OtherIncome::create([...$data, 'created_by' => $request->user()->id]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ingreso registrado.']);

        return back();
    }

    public function destroyIncome(OtherIncome $income): RedirectResponse
    {
        $income->delete();

        return back();
    }

    /**
     * Balance de los últimos 12 meses en CSV (se abre directo en Excel).
     */
    public function export(Request $request): StreamedResponse
    {
        $month = $request->validate(['mes' => ['nullable', 'date_format:Y-m']])['mes'] ?? today()->format('Y-m');
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);

        return response()->streamDownload(function () use ($start) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // BOM para que Excel muestre bien las tildes
            fputcsv($out, ['Mes', 'Pensiones', 'Otros ingresos', 'Total ingresos', 'Planilla', 'Gastos', 'Total egresos', 'Resultado'], ';');

            foreach (range(11, 0) as $i) {
                $row = $this->payroll->balance($start->subMonthsNoOverflow($i)->format('Y-m'));
                fputcsv($out, array_map(
                    fn ($value) => is_float($value) ? number_format($value, 2, ',', '') : $value,
                    [$row['month'], $row['tuition'], $row['other_income'], $row['income'], $row['payroll'], $row['expenses'], $row['outflow'], $row['result']],
                ), ';');
            }

            fclose($out);
        }, "balance-villajardin-{$month}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
