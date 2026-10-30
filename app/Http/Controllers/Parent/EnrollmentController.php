<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Http\Requests\EnrollmentRequestForm;
use App\Models\EnrollmentRequest;
use App\Models\Level;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Services\CloudinaryService;
use App\Services\Notifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Matrícula en línea desde la cuenta del padre o la madre.
 */
class EnrollmentController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('enrollment/index', [
            'requests' => EnrollmentRequest::query()
                ->with(['schoolYear', 'level'])
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get()
                ->map(fn (EnrollmentRequest $enrollment) => $enrollment->toClient()),
            'children' => $request->user()->children()->orderBy('first_name')->get()
                ->map(fn (Student $student) => ['id' => $student->id, 'name' => $student->fullName()]),
        ]);
    }

    public function create(Request $request): Response
    {
        $student = $request->integer('alumno')
            ? $request->user()->children()->whereKey($request->integer('alumno'))->first()
            : null;

        return $this->form($request, null, $student);
    }

    public function store(EnrollmentRequestForm $request, Notifier $notifier): RedirectResponse
    {
        $enrollment = EnrollmentRequest::create([...$request->payload(), 'user_id' => $request->user()->id, 'status' => 'enviada']);

        $notifier->send($notifier->admins(), 'enrollment', 'Nueva matrícula en línea', "{$enrollment->childName()} · {$request->user()->name}", route('admin.enrollments.show', $enrollment, false), $request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Enviamos tu solicitud de matrícula. Te avisaremos cuando la revisemos.']);

        return to_route('enrollment.index');
    }

    public function edit(Request $request, EnrollmentRequest $enrollment): Response
    {
        abort_unless($enrollment->user_id === $request->user()->id && $enrollment->isEditable(), 403);

        return $this->form($request, $enrollment);
    }

    public function update(EnrollmentRequestForm $request, EnrollmentRequest $enrollment, Notifier $notifier): RedirectResponse
    {
        abort_unless($enrollment->user_id === $request->user()->id && $enrollment->isEditable(), 403);

        $wasObserved = $enrollment->status === 'observada';
        $enrollment->update([...$request->payload(), 'status' => 'enviada']);

        if ($wasObserved) {
            $notifier->send($notifier->admins(), 'enrollment', 'Matrícula corregida', "{$enrollment->childName()} · {$request->user()->name}", route('admin.enrollments.show', $enrollment, false), $request->user());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Solicitud actualizada.']);

        return to_route('enrollment.index');
    }

    private function form(Request $request, ?EnrollmentRequest $enrollment = null, ?Student $student = null): Response
    {
        $current = SchoolYear::current();
        $prefill = $student ? [
            'student_id' => $student->id,
            'child' => [
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'dni' => $student->dni,
                'birth_date' => $student->birth_date?->toDateString(),
                'sex' => $student->sex,
                'allergies' => $student->allergies,
                'medical_notes' => $student->medical_notes,
            ],
            'relationship' => $student->guardians()->whereKey($request->user()->id)->first()?->pivot->relationship,
            'pickups' => $student->authorizedPickups()->get()->map(fn ($p) => $p->only(['name', 'dni', 'relationship', 'phone']))->values(),
            'image_consent' => $student->image_consent,
        ] : null;

        return Inertia::render('enrollment/form', [
            'enrollment' => $enrollment?->load(['schoolYear', 'level'])->toClient(),
            'prefill' => $prefill,
            'years' => SchoolYear::query()->where('year', '>=', $current?->year ?? 0)->orderBy('year')->get()
                ->map(fn (SchoolYear $year) => ['value' => $year->id, 'label' => (string) $year->year]),
            'levels' => Level::orderBy('position')->get()->map(fn (Level $level) => ['value' => $level->id, 'label' => $level->name]),
            'documentTypes' => collect(EnrollmentRequest::DOCUMENT_TYPES)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }
}
