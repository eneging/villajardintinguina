<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\DocumentPresenter;
use App\Models\AuthorizedPickup;
use App\Models\Charge;
use App\Models\Document;
use App\Models\Media;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Ficha del alumno (para la administradora, sus apoderados y su maestra) y
 * la página "Mis hijos" de los padres.
 */
class StudentProfileController extends Controller
{
    public function children(Request $request): Response
    {
        $children = $request->user()->children()
            ->with(['photo', 'currentEnrollment.classroom.level'])
            ->orderBy('first_name')
            ->get();

        $today = StudentAttendance::query()
            ->whereIn('enrollment_id', $children->pluck('currentEnrollment.id')->filter())
            ->whereDate('date', today())
            ->get()
            ->keyBy('enrollment_id');

        $balances = Charge::query()
            ->active()
            ->withPaidAmount()
            ->whereIn('student_id', $children->pluck('id'))
            ->get()
            ->groupBy('student_id');

        return Inertia::render('students/children', [
            'children' => $children->map(fn (Student $student) => [
                ...$this->summary($student),
                'today' => $today->get($student->currentEnrollment?->id)?->status,
                'balance' => round($balances->get($student->id, collect())->sum(fn (Charge $charge) => max(0, $charge->balance())), 2),
                'overdue' => $balances->get($student->id, collect())->contains(fn (Charge $charge) => $charge->isOverdue()),
            ]),
        ]);
    }

    public function show(Request $request, Student $student): Response
    {
        Gate::authorize('view', $student);

        $user = $request->user();
        $canManage = $user->can('manage', $student);
        $student->load(['photo', 'guardians', 'authorizedPickups.photo', 'currentEnrollment.classroom.level', 'currentEnrollment.classroom.staff']);
        $enrollment = $student->currentEnrollment;

        $month = today()->startOfMonth();
        $attendance = $enrollment
            ? StudentAttendance::query()
                ->where('enrollment_id', $enrollment->id)
                ->whereDate('date', '>=', $month)
                ->orderBy('date')
                ->get()
            : collect();

        return Inertia::render('students/show', [
            'student' => [
                ...$this->summary($student),
                'dni' => $student->dni,
                'birth_date' => $student->birth_date?->toDateString(),
                'sex' => $student->sex,
                'allergies' => $student->allergies,
                'medical_notes' => $student->medical_notes,
                'image_consent' => $student->image_consent,
                'staff' => $enrollment?->classroom->staff->map(fn (User $member) => ['name' => $member->name, 'role' => $member->pivot->role])->values() ?? [],
            ],
            'guardians' => $student->guardians->map(fn (User $guardian) => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'phone' => $guardian->phone,
                'relationship' => $guardian->pivot->relationship,
                'can_pick_up' => (bool) $guardian->pivot->can_pick_up,
                'is_billing_contact' => (bool) $guardian->pivot->is_billing_contact,
            ]),
            'pickups' => $student->authorizedPickups->map(fn (AuthorizedPickup $pickup) => $pickup->toClient()),
            'attendance' => [
                'month' => $month->format('Y-m'),
                'counts' => $attendance->countBy('status'),
                'records' => $attendance->map(fn (StudentAttendance $record) => [
                    'date' => $record->date->toDateString(),
                    'status' => $record->status,
                    'picked_up_by' => $record->picked_up_by,
                ])->values(),
            ],
            'charges' => $canManage
                ? Charge::query()->active()->withPaidAmount()->where('student_id', $student->id)
                    ->orderByDesc('due_on')->limit(12)->get()->map(fn (Charge $charge) => $charge->toClient())
                : null,
            'documents' => $canManage
                ? Document::query()->where('owner_type', 'student')->where('owner_id', $student->id)
                    ->when(! $user->isAdmin(), fn ($q) => $q->where('visibility', 'shared'))
                    ->latest()->get()->map(fn (Document $document) => DocumentPresenter::row($document))
                : null,
            'can' => [
                'manage' => $canManage,
                'updatePhoto' => $user->can('updatePhoto', $student),
                'edit' => $user->isAdmin(),
            ],
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    public function updatePhoto(Request $request, Student $student): RedirectResponse
    {
        Gate::authorize('updatePhoto', $student);

        $data = $request->validate(['media_id' => ['nullable', 'integer', 'exists:media,id']]);

        if ($data['media_id']) {
            $media = Media::findOrFail($data['media_id']);
            abort_unless(app(CloudinaryService::class)->belongsToFolder($media->public_id, "alumnos/{$student->id}"), 422);
        }

        $student->update(['photo_media_id' => $data['media_id']]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Foto actualizada.']);

        return back();
    }

    public function storePickup(Request $request, Student $student): RedirectResponse
    {
        Gate::authorize('manage', $student);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'dni' => ['required', 'digits:8'],
            'relationship' => ['required', 'string', 'max:40'],
            'phone' => ['nullable', 'string', 'max:20'],
            'photo_media_id' => ['nullable', 'integer', 'exists:media,id'],
        ], [], ['name' => 'nombre', 'relationship' => 'parentesco', 'phone' => 'celular']);

        if ($data['photo_media_id'] ?? null) {
            abort_unless(app(CloudinaryService::class)->belongsToFolder(Media::findOrFail($data['photo_media_id'])->public_id, "alumnos/{$student->id}"), 422);
        }

        abort_if($student->authorizedPickups()->count() >= 10, 422, 'Máximo 10 personas autorizadas.');

        $student->authorizedPickups()->create([...$data, 'added_by' => $request->user()->id]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Persona autorizada agregada.']);

        return back();
    }

    public function destroyPickup(Request $request, AuthorizedPickup $pickup): RedirectResponse
    {
        Gate::authorize('manage', $pickup->student);

        $pickup->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Autorización retirada.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Student $student): array
    {
        $classroom = $student->currentEnrollment?->classroom;

        return [
            'id' => $student->id,
            'name' => $student->fullName(),
            'first_name' => $student->first_name,
            'age' => $student->age(),
            'photo' => $student->photo?->toClient(),
            'classroom' => $classroom ? [
                'id' => $classroom->id,
                'name' => $classroom->name,
                'level' => $classroom->level?->name,
                'color' => $classroom->color,
                'mascot' => $classroom->mascot,
            ] : null,
        ];
    }
}
