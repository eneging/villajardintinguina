<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Document;
use App\Models\EnrollmentRequest;
use App\Models\Student;
use App\Services\Notifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Revisión de matrículas en línea: aprobar crea el alumno, su matrícula,
 * los autorizados y archiva los documentos.
 */
class EnrollmentRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->validate(['estado' => ['nullable', Rule::in(array_keys(EnrollmentRequest::STATUSES))]])['estado'] ?? null;

        return Inertia::render('admin/enrollments/index', [
            'requests' => EnrollmentRequest::query()
                ->with(['user', 'schoolYear', 'level'])
                ->when($status, fn ($q) => $q->where('status', $status))
                ->latest()
                ->limit(200)
                ->get()
                ->map(fn (EnrollmentRequest $enrollment) => [
                    'id' => $enrollment->id,
                    'child_name' => $enrollment->childName(),
                    'parent' => $enrollment->user->name,
                    'year' => $enrollment->schoolYear->year,
                    'level' => $enrollment->level?->name,
                    'status' => $enrollment->status,
                    'status_label' => EnrollmentRequest::STATUSES[$enrollment->status],
                    'renewal' => $enrollment->student_id !== null,
                    'created_at' => $enrollment->created_at->toIso8601String(),
                ]),
            'counts' => EnrollmentRequest::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'statuses' => EmployeeController::options(EnrollmentRequest::STATUSES),
            'status' => $status ?? '',
        ]);
    }

    public function show(EnrollmentRequest $enrollment): Response
    {
        $enrollment->load(['user', 'schoolYear', 'level']);

        return Inertia::render('admin/enrollments/show', [
            'enrollment' => [
                ...$enrollment->toClient(),
                'parent' => $enrollment->user->only(['id', 'name', 'email', 'phone', 'dni']),
            ],
            'classrooms' => Classroom::query()->where('school_year_id', $enrollment->school_year_id)->with('level')->orderBy('level_id')->get()
                ->map(fn (Classroom $classroom) => ['value' => $classroom->id, 'label' => "{$classroom->name} ({$classroom->level->name})", 'level_id' => $classroom->level_id]),
        ]);
    }

    public function approve(Request $request, EnrollmentRequest $enrollment, Notifier $notifier): RedirectResponse
    {
        abort_unless($enrollment->isEditable(), 422, 'Esta solicitud ya fue resuelta.');

        $data = $request->validate([
            'classroom_id' => ['required', 'integer', Rule::exists('classrooms', 'id')->where('school_year_id', $enrollment->school_year_id)],
            'monthly_fee' => ['required', 'numeric', 'min:0', 'max:99999'],
            'discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ], [], ['classroom_id' => 'salón', 'monthly_fee' => 'mensualidad']);

        $child = $enrollment->child;

        if (! empty($child['dni'])) {
            $duplicate = Student::where('dni', $child['dni'])->whereKeyNot($enrollment->student_id ?? 0)->first();

            if ($duplicate) {
                throw ValidationException::withMessages(['classroom_id' => "Ya existe un alumno con DNI {$child['dni']} ({$duplicate->fullName()})."]);
            }
        }

        $student = DB::transaction(function () use ($enrollment, $child, $data, $request) {
            $attributes = [
                'first_name' => $child['first_name'],
                'last_name' => $child['last_name'],
                'dni' => $child['dni'] ?? null,
                'birth_date' => $child['birth_date'],
                'sex' => $child['sex'],
                'allergies' => $child['allergies'] ?? null,
                'medical_notes' => collect([
                    $child['medical_notes'] ?? null,
                    ! empty($child['blood_type']) ? "Grupo sanguíneo: {$child['blood_type']}" : null,
                    ! empty($child['insurance']) ? "Seguro: {$child['insurance']}" : null,
                    ! empty($enrollment->emergency_contact['name']) ? "Emergencia: {$enrollment->emergency_contact['name']} ({$enrollment->emergency_contact['phone']})" : null,
                ])->filter()->implode("\n") ?: null,
                'image_consent' => $enrollment->image_consent,
            ];

            $student = $enrollment->student ?? new Student;
            $student->fill($attributes)->save();

            $student->guardians()->syncWithoutDetaching([
                $enrollment->user_id => ['relationship' => $enrollment->relationship, 'is_billing_contact' => true, 'can_pick_up' => true],
            ]);

            foreach ($enrollment->pickups ?? [] as $pickup) {
                $student->authorizedPickups()->updateOrCreate(
                    ['dni' => $pickup['dni']],
                    ['name' => $pickup['name'], 'relationship' => $pickup['relationship'], 'phone' => $pickup['phone'] ?? null, 'added_by' => $request->user()->id],
                );
            }

            $student->enrollments()->updateOrCreate(
                ['school_year_id' => $enrollment->school_year_id],
                ['classroom_id' => $data['classroom_id'], 'monthly_fee' => $data['monthly_fee'], 'discount_pct' => $data['discount_pct'] ?? 0, 'status' => 'active'],
            );

            foreach ($enrollment->documents ?? [] as $document) {
                Document::firstOrCreate(
                    ['owner_type' => 'student', 'owner_id' => $student->id, 'media_id' => $document['media_id']],
                    [
                        'category' => EnrollmentRequest::DOCUMENT_TYPES[$document['type']] ?? 'Otro',
                        'title' => (EnrollmentRequest::DOCUMENT_TYPES[$document['type']] ?? 'Documento').' — '.$student->fullName(),
                        'visibility' => 'shared',
                        'uploaded_by' => $enrollment->user_id,
                    ],
                );
            }

            $enrollment->update(['student_id' => $student->id, 'status' => 'aprobada', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);

            return $student;
        });

        $notifier->send($enrollment->user, 'enrollment', '¡Matrícula aprobada!', "{$student->fullName()} ya está matriculado(a).", route('children.index', absolute: false), $request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => "Matrícula de {$student->first_name} aprobada."]);

        return to_route('students.show', $student);
    }

    public function observe(Request $request, EnrollmentRequest $enrollment, Notifier $notifier): RedirectResponse
    {
        abort_unless($enrollment->isEditable(), 422);

        $data = $request->validate([
            'status' => ['required', 'in:observada,rechazada'],
            'admin_notes' => ['required', 'string', 'max:1000'],
        ], [], ['admin_notes' => 'motivo']);

        $enrollment->update([...$data, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);

        $notifier->send(
            $enrollment->user,
            'enrollment',
            $data['status'] === 'observada' ? 'Tu matrícula tiene observaciones' : 'Solicitud de matrícula no aprobada',
            $data['admin_notes'],
            route('enrollment.index', absolute: false),
            $request->user(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => $data['status'] === 'observada' ? 'Observación enviada a la familia.' : 'Solicitud rechazada.']);

        return back();
    }
}
