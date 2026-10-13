<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ChargeConcept;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Models\Charge;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Reminder;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\User;
use App\Services\BillingService;
use App\Services\CloudinaryService;
use App\Services\PaymentReminders;
use App\Support\CsvExport;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Cobranza de pensiones: cuotas, pagos, verificación de vouchers y morosidad.
 */
class BillingController extends Controller
{
    public function __construct(private readonly BillingService $billing) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'period' => ['nullable', 'date_format:Y-m'],
            'status' => ['nullable', 'in:pendiente,vencida,pagada,parcial'],
            'classroom' => ['nullable', 'integer'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);
        $period = $filters['period'] ?? now()->format('Y-m');

        $charges = Charge::query()
            ->active()
            ->withPaidAmount()
            ->with(['student', 'enrollment.classroom'])
            ->where(fn (Builder $q) => $q->where('period', $period)->orWhere(
                fn (Builder $other) => $other->whereNull('period')->where('due_on', 'like', "{$period}%"),
            ))
            ->when($filters['classroom'] ?? null, fn ($q, $id) => $q->whereHas('enrollment', fn ($e) => $e->where('classroom_id', $id)))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->whereHas('student', fn ($s) => $s
                ->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")))
            ->orderBy('due_on')
            ->get()
            ->when($filters['status'] ?? null, fn ($collection, $status) => $collection->filter(fn (Charge $charge) => $charge->status() === $status))
            ->values();

        $monthStart = now()->startOfMonth();

        return Inertia::render('admin/billing/index', [
            'charges' => $charges->map(fn (Charge $charge) => [
                ...$charge->toClient(),
                'student' => ['id' => $charge->student->id, 'name' => $charge->student->fullName()],
                'classroom' => $charge->enrollment->classroom->name,
            ]),
            'stats' => [
                'collected_this_month' => (float) Payment::query()
                    ->where('status', PaymentStatus::Confirmed)
                    ->whereBetween('paid_on', [$monthStart, now()->endOfMonth()])
                    ->sum('amount'),
                'period_total' => round($charges->sum(fn (Charge $c) => (float) $c->amount), 2),
                'period_outstanding' => round($charges->sum(fn (Charge $c) => max(0, $c->balance())), 2),
                'pending_vouchers' => Payment::where('status', PaymentStatus::Pending)->count(),
            ],
            'pendingPayments' => Payment::query()
                ->where('status', PaymentStatus::Pending)
                ->with(['payer', 'voucher', 'allocations.charge.student'])
                ->latest()
                ->get()
                ->map(fn (Payment $payment) => $payment->toClient()),
            'filters' => [
                'period' => $period,
                'status' => $filters['status'] ?? '',
                'classroom' => isset($filters['classroom']) ? (string) $filters['classroom'] : '',
                'search' => $filters['search'] ?? '',
            ],
            'classrooms' => Classroom::query()
                ->where('school_year_id', SchoolYear::current()?->id)
                ->orderBy('level_id')
                ->get()
                ->map(fn (Classroom $classroom) => ['value' => $classroom->id, 'label' => $classroom->name]),
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $data = $request->validate(['period' => ['required', 'date_format:Y-m']]);
        $created = $this->billing->generateMonthly($data['period'], $request->user());

        Inertia::flash('toast', [
            'type' => $created ? 'success' : 'info',
            'message' => $created ? "Se generaron {$created} mensualidades." : 'Las mensualidades de ese mes ya estaban generadas.',
        ]);

        return to_route('admin.billing.index', ['period' => $data['period']]);
    }

    /**
     * Estado de cuenta del alumno.
     */
    public function student(Student $student): Response
    {
        $student->load(['guardians', 'currentEnrollment.classroom']);

        $charges = $student->charges()
            ->withPaidAmount()
            ->orderBy('due_on')
            ->get();

        $payments = Payment::query()
            ->whereHas('allocations.charge', fn ($q) => $q->where('student_id', $student->id))
            ->with(['payer', 'voucher', 'receipt', 'allocations.charge.student'])
            ->latest('paid_on')
            ->get();

        return Inertia::render('admin/billing/student', [
            'student' => [
                'id' => $student->id,
                'name' => $student->fullName(),
                'classroom' => $student->currentEnrollment?->classroom->name,
                'enrollment_id' => $student->currentEnrollment?->id,
                'guardians' => $student->guardians->map(fn (User $guardian) => [
                    'id' => $guardian->id,
                    'name' => $guardian->name,
                    'phone' => $guardian->phone,
                    'is_billing_contact' => (bool) $guardian->pivot->is_billing_contact,
                ]),
            ],
            'charges' => $charges->map(fn (Charge $charge) => $charge->toClient()),
            'payments' => $payments->map(fn (Payment $payment) => $payment->toClient()),
            'methods' => PaymentMethod::options(),
            'concepts' => array_map(fn (ChargeConcept $concept) => ['value' => $concept->value, 'label' => $concept->label()], [ChargeConcept::Enrollment, ChargeConcept::Other]),
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    public function storeCharge(Request $request, Student $student): RedirectResponse
    {
        $enrollment = $student->currentEnrollment;
        abort_unless($enrollment, 422, 'El alumno no tiene matrícula este año.');

        $data = $request->validate([
            'concept' => ['required', Rule::in([ChargeConcept::Enrollment->value, ChargeConcept::Other->value])],
            'description' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:99999'],
            'due_on' => ['required', 'date'],
        ], [], ['description' => 'descripción', 'amount' => 'monto', 'due_on' => 'vencimiento']);

        $enrollment->charges()->create([
            ...$data,
            'student_id' => $student->id,
            // Sin periodo: la regla de "una mensualidad por mes" solo aplica a mensualidades.
            'period' => null,
            'created_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cuota agregada.']);

        return back();
    }

    /**
     * Cargo para todo el salón o todo el colegio (materiales, uniforme, paseo…).
     * No duplica: omite a quien ya tiene un cargo vigente con la misma descripción.
     */
    public function storeBulkCharge(Request $request): RedirectResponse
    {
        $year = SchoolYear::current();
        abort_unless($year, 422, 'No hay un año escolar activo.');

        $data = $request->validate([
            'classroom_id' => ['nullable', 'integer', Rule::exists('classrooms', 'id')->where('school_year_id', $year->id)],
            'concept' => ['required', Rule::in([ChargeConcept::Enrollment->value, ChargeConcept::Other->value])],
            'description' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:99999'],
            'due_on' => ['required', 'date'],
        ], [], ['description' => 'descripción', 'amount' => 'monto', 'due_on' => 'vencimiento', 'classroom_id' => 'salón']);

        $created = DB::transaction(function () use ($data, $year, $request) {
            $enrollments = Enrollment::query()
                ->where('school_year_id', $year->id)
                ->where('status', 'active')
                ->when($data['classroom_id'] ?? null, fn ($q, $id) => $q->where('classroom_id', $id))
                ->whereDoesntHave('charges', fn ($q) => $q->whereNull('voided_at')->where('description', $data['description']))
                ->get();

            foreach ($enrollments as $enrollment) {
                $enrollment->charges()->create([
                    'student_id' => $enrollment->student_id,
                    'concept' => $data['concept'],
                    'description' => $data['description'],
                    'amount' => $data['amount'],
                    'due_on' => $data['due_on'],
                    'period' => null,
                    'created_by' => $request->user()->id,
                ]);
            }

            return $enrollments->count();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => "Cargo agregado a {$created} alumno(s)."]);

        return back();
    }

    public function voidCharge(Request $request, Charge $charge): RedirectResponse
    {
        abort_if($charge->allocations()->whereHas('payment', fn ($q) => $q->where('status', '!=', PaymentStatus::Rejected))->exists(), 422, 'La cuota tiene pagos registrados: no se puede anular.');

        $charge->update(['voided_at' => now()]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cuota anulada.']);

        return back();
    }

    public function storePayment(PaymentRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('charge_ids');
        $firstCharge = Charge::with('student.guardians')->findOrFail($request->validated('charge_ids')[0]);

        try {
            $this->billing->registerPayment(
                [...$data, 'payer_id' => $this->billing->billingContact($firstCharge->student)?->id],
                $request->validated('charge_ids'),
                $request->user(),
                PaymentStatus::Confirmed,
            );
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['amount' => $exception->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pago registrado.']);

        return back();
    }

    public function confirm(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($payment->status === PaymentStatus::Pending, 409);

        try {
            $this->billing->confirm($payment, $request->user());
        } catch (InvalidArgumentException $exception) {
            abort(422, $exception->getMessage());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pago confirmado.']);

        return back();
    }

    public function reject(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($payment->status === PaymentStatus::Pending, 409);
        $data = $request->validate(['reason' => ['required', 'string', 'max:255']], [], ['reason' => 'motivo']);

        $this->billing->reject($payment, $request->user(), $data['reason']);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pago rechazado.']);

        return back();
    }

    /**
     * Familias con cuotas vencidas.
     */
    public function debtors(): Response
    {
        $debtors = $this->billing->debtors();
        $lastReminders = Reminder::query()
            ->where('kind', 'payment')
            ->whereIn('user_id', $debtors->pluck('contact.id')->filter())
            ->selectRaw('user_id, max(created_at) as last_at')
            ->groupBy('user_id')
            ->pluck('last_at', 'user_id');

        return Inertia::render('admin/billing/debtors', [
            'debtors' => $debtors->map(fn (array $debtor) => [
                'contact' => $debtor['contact'] ? [
                    'id' => $debtor['contact']->id,
                    'name' => $debtor['contact']->name,
                    'phone' => $debtor['contact']->phone,
                ] : null,
                'total' => $debtor['total'],
                'max_days_late' => $debtor['max_days_late'],
                'last_reminder_at' => $debtor['contact'] ? $lastReminders[$debtor['contact']->id] ?? null : null,
                'charges' => $debtor['charges']->map(fn (Charge $charge) => [
                    'id' => $charge->id,
                    'description' => $charge->description,
                    'student' => ['id' => $charge->student->id, 'name' => $charge->student->fullName()],
                    'balance' => $charge->balance(),
                    'due_on' => $charge->due_on->toDateString(),
                    'days_late' => $charge->daysLate(),
                ]),
            ]),
            'school' => config('school.name'),
        ]);
    }

    public function exportDebtors(): StreamedResponse
    {
        return CsvExport::download(
            'morosos-villajardin-'.today()->format('Y-m-d').'.csv',
            ['Apoderado', 'Celular', 'Correo', 'Alumno(s)', 'Cuotas vencidas', 'Total', 'Máx. días de atraso'],
            $this->billing->debtors()->map(fn (array $debtor) => [
                $debtor['contact']?->name ?? 'Sin apoderado',
                $debtor['contact']?->phone,
                $debtor['contact']?->email,
                $debtor['charges']->map(fn (Charge $charge) => $charge->student->fullName())->unique()->implode(', '),
                $debtor['charges']->map(fn (Charge $charge) => $charge->description)->implode(', '),
                (float) $debtor['total'],
                $debtor['max_days_late'],
            ]),
        );
    }

    /**
     * Envía de una vez el recordatorio por correo (y WhatsApp API si está configurado)
     * a todas las familias morosas que no recibieron uno en los últimos días.
     */
    public function remindAll(Request $request, PaymentReminders $reminders): RedirectResponse
    {
        $result = $reminders->sendAll($request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => "Recordatorios enviados: {$result['sent']}. Omitidos por envío reciente: {$result['skipped']}. Sin correo ni WhatsApp: {$result['failed']}."]);

        return back();
    }

    /**
     * Deja constancia del recordatorio (el mensaje se abre en WhatsApp desde el navegador).
     */
    public function remind(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate(['total' => ['required', 'numeric'], 'charge_ids' => ['array']]);

        Reminder::create([
            'user_id' => $user->id,
            'kind' => 'payment',
            'channel' => 'whatsapp',
            'payload' => $data,
            'sent_by' => $request->user()->id,
        ]);

        return back();
    }
}
