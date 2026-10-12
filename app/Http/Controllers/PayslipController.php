<?php

namespace App\Http\Controllers;

use App\Models\PayrollItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Mis boletas": el personal ve sus pagos de planillas aprobadas.
 */
class PayslipController extends Controller
{
    public function index(Request $request): Response
    {
        $items = PayrollItem::query()
            ->whereHas('employee', fn ($q) => $q->where('user_id', $request->user()->id))
            ->whereHas('run', fn ($q) => $q->where('status', '!=', 'borrador'))
            ->with(['run', 'employee', 'voucher'])
            ->get()
            ->sortByDesc('run.period')
            ->values();

        return Inertia::render('payroll/mine', [
            'items' => $items->map(fn (PayrollItem $item) => [...$item->toClient(), 'period' => $item->run->period]),
        ]);
    }

    public function show(Request $request, PayrollItem $item): Response
    {
        $item->load(['employee', 'run', 'voucher']);
        abort_unless($item->employee->user_id === $request->user()->id && ! $item->run->isDraft(), 403);

        return Inertia::render('payroll/slip', [
            'item' => $item->toClient(),
            'period' => $item->run->period,
            'school' => ['name' => config('school.name'), 'legal_name' => config('school.legal_name'), 'ruc' => config('school.ruc')],
        ]);
    }
}
