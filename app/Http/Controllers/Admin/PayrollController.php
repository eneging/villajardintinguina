<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Services\CloudinaryService;
use App\Services\PayrollService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class PayrollController extends Controller
{
    public function __construct(private readonly PayrollService $payroll) {}

    public function index(): Response
    {
        return Inertia::render('admin/payroll/index', [
            'runs' => PayrollRun::query()->withCount('items')->orderByDesc('period')->get()->map(fn (PayrollRun $run) => [
                'id' => $run->id,
                'period' => $run->period,
                'status' => $run->status,
                'total_net' => (float) $run->total_net,
                'items_count' => $run->items_count,
            ]),
            'currentPeriod' => today()->format('Y-m'),
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $period = $request->validate(['period' => ['required', 'date_format:Y-m']])['period'];

        try {
            $run = $this->payroll->generate($period);
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['period' => $exception->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "Planilla de {$period} calculada con la asistencia del mes."]);

        return to_route('admin.payroll.show', $run);
    }

    public function show(PayrollRun $run): Response
    {
        $run->load(['items.employee', 'items.voucher', 'approver']);

        return Inertia::render('admin/payroll/show', [
            'run' => [
                'id' => $run->id,
                'period' => $run->period,
                'status' => $run->status,
                'total_net' => (float) $run->total_net,
                'approved_by' => $run->approver?->name,
                'approved_at' => $run->approved_at?->toIso8601String(),
            ],
            'items' => $run->items->sortBy('employee.name')->values()->map(fn (PayrollItem $item) => $item->toClient()),
            'methods' => PaymentMethod::options(),
            'lateRate' => config('school.payroll.late_deduction_per_minute'),
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    public function updateItem(Request $request, PayrollItem $item): RedirectResponse
    {
        $data = $request->validate([
            'bonuses' => ['required', 'numeric', 'min:0', 'max:99999'],
            'other_deductions' => ['required', 'numeric', 'min:0', 'max:99999'],
            'absences' => ['required', 'integer', 'min:0', 'max:31'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $this->payroll->updateItem($item, (float) $data['bonuses'], (float) $data['other_deductions'], (int) $data['absences'], $data['notes'] ?? null);
        } catch (InvalidArgumentException $exception) {
            abort(409, $exception->getMessage());
        }

        return back();
    }

    public function approve(Request $request, PayrollRun $run): RedirectResponse
    {
        try {
            $this->payroll->approve($run, $request->user());
        } catch (InvalidArgumentException $exception) {
            abort(409, $exception->getMessage());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Planilla aprobada. Registra cada pago cuando lo hagas.']);

        return back();
    }

    public function pay(Request $request, PayrollItem $item, CloudinaryService $cloudinary): RedirectResponse
    {
        $data = $request->validate([
            'paid_on' => ['required', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'operation_number' => ['nullable', 'string', 'max:50'],
            'voucher_media_id' => ['nullable', 'integer', 'exists:media,id'],
        ]);

        if (! empty($data['voucher_media_id']) && ! $cloudinary->belongsToFolder(Media::find($data['voucher_media_id'])->public_id, 'pagos')) {
            throw ValidationException::withMessages(['voucher_media_id' => 'Archivo no válido.']);
        }

        try {
            $this->payroll->markPaid($item, $data);
        } catch (InvalidArgumentException $exception) {
            abort(409, $exception->getMessage());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "Pago a {$item->employee->name} registrado."]);

        return back();
    }

    /**
     * Boleta de pago imprimible.
     */
    public function slip(PayrollItem $item): Response
    {
        $item->load(['employee', 'run', 'voucher']);

        return Inertia::render('payroll/slip', [
            'item' => $item->toClient(),
            'period' => $item->run->period,
            'school' => ['name' => config('school.name'), 'legal_name' => config('school.legal_name'), 'ruc' => config('school.ruc')],
        ]);
    }
}
