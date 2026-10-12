<?php

namespace App\Http\Controllers\Parent;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Models\Charge;
use App\Models\Payment;
use App\Models\Student;
use App\Services\BillingService;
use App\Services\CloudinaryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

/**
 * "Mis pagos": el padre ve las cuotas de sus hijos, sus comprobantes y reporta pagos con voucher.
 */
class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $children = $request->user()->children()->get();
        $studentIds = $children->pluck('id');

        $charges = Charge::query()
            ->active()
            ->withPaidAmount()
            ->whereIn('student_id', $studentIds)
            ->orderBy('due_on')
            ->get();

        $payments = Payment::query()
            ->whereHas('allocations.charge', fn ($q) => $q->whereIn('student_id', $studentIds))
            ->with(['payer', 'voucher', 'receipt', 'allocations.charge.student'])
            ->latest('paid_on')
            ->get();

        return Inertia::render('payments/index', [
            'children' => $children->map(fn (Student $student) => [
                'id' => $student->id,
                'name' => $student->fullName(),
                'charges' => $charges->where('student_id', $student->id)
                    ->map(fn (Charge $charge) => $charge->toClient())
                    ->values(),
            ]),
            'payments' => $payments->map(fn (Payment $payment) => $payment->toClient()),
            'methods' => array_values(array_filter(
                PaymentMethod::options(),
                fn ($method) => in_array($method['value'], ['yape', 'plin', 'transferencia', 'otro'], true),
            )),
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    public function store(PaymentRequest $request, BillingService $billing): RedirectResponse
    {
        $childIds = $request->user()->children()->pluck('students.id');
        $chargeIds = $request->validated('charge_ids');

        abort_if(
            Charge::whereKey($chargeIds)->whereNotIn('student_id', $childIds)->exists(),
            403,
        );

        try {
            $billing->registerPayment(
                [...$request->safe()->except(['charge_ids', 'receipt_type', 'receipt_number', 'receipt_media_id']), 'payer_id' => $request->user()->id],
                $chargeIds,
                $request->user(),
                PaymentStatus::Pending,
            );
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['amount' => $exception->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Recibimos tu voucher. La administración lo verificará pronto.']);

        return back();
    }
}
