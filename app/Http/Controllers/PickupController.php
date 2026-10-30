<?php

namespace App\Http\Controllers;

use App\Models\AuthorizedPickup;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\User;
use App\Services\Notifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Recojo con código QR: la maestra escanea el código del apoderado o de la
 * persona autorizada, ve su foto y DNI, y registra la entrega del niño.
 */
class PickupController extends Controller
{
    public static function tokenFor(User|AuthorizedPickup $holder): string
    {
        if (! $holder->pickup_token) {
            $holder->forceFill(['pickup_token' => Str::random(32)])->save();
        }

        return $holder->pickup_token;
    }

    public function scan(Request $request, string $token): Response
    {
        [$person, $students] = $this->resolve($token);

        $students = $students->filter(fn (Student $student) => $student->currentEnrollment
            && Gate::allows('takeAttendance', $student->currentEnrollment->classroom));

        abort_if($students->isEmpty() && ! $request->user()->isAdmin(), 403, 'Esta persona no recoge a niños de tus salones.');

        $today = StudentAttendance::query()
            ->whereIn('enrollment_id', $students->pluck('currentEnrollment.id'))
            ->whereDate('date', today())
            ->get()
            ->keyBy('enrollment_id');

        return Inertia::render('pickups/scan', [
            'token' => $token,
            'person' => $person,
            'students' => $students->values()->map(fn (Student $student) => [
                'id' => $student->id,
                'name' => $student->fullName(),
                'photo' => $student->photo?->url('f_auto,q_auto,w_160,h_160,c_fill,g_face'),
                'classroom' => $student->currentEnrollment->classroom->name,
                'status' => $today->get($student->currentEnrollment->id)?->status,
                'left_at' => $today->get($student->currentEnrollment->id)?->left_at ? substr($today->get($student->currentEnrollment->id)->left_at, 0, 5) : null,
                'picked_up_by' => $today->get($student->currentEnrollment->id)?->picked_up_by,
            ]),
        ]);
    }

    public function handOver(Request $request, string $token, Notifier $notifier): RedirectResponse
    {
        [$person, $students] = $this->resolve($token);
        $student = $students->firstWhere('id', (int) $request->input('student_id')) ?? abort(422, 'Esta persona no está autorizada para este niño.');
        $enrollment = $student->currentEnrollment ?? abort(422);
        Gate::authorize('takeAttendance', $enrollment->classroom);

        $record = StudentAttendance::query()->where('enrollment_id', $enrollment->id)->whereDate('date', today())->first()
            ?? new StudentAttendance(['enrollment_id' => $enrollment->id, 'classroom_id' => $enrollment->classroom_id, 'date' => today()->toDateString(), 'status' => 'presente']);

        $label = "{$person['name']} ({$person['relationship']}".($person['dni'] ? ", DNI {$person['dni']}" : '').') · QR';
        $record->fill(['left_at' => now()->format('H:i'), 'picked_up_by' => $label, 'recorded_by' => $request->user()->id])->save();

        $notifier->send(
            $student->guardians()->get(),
            'pickup',
            "{$student->first_name} salió del colegio",
            "Lo recogió {$person['name']} a las ".now()->format('H:i').'.',
            route('attendance.mine', absolute: false),
            $request->user(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$student->first_name} entregado a {$person['name']}."]);

        return back();
    }

    /**
     * @return array{0: array<string, mixed>, 1: Collection<int, Student>}
     */
    private function resolve(string $token): array
    {
        abort_unless(strlen($token) === 32, 404);

        if ($guardian = User::where('pickup_token', $token)->first()) {
            $students = $guardian->children()->wherePivot('can_pick_up', true)->with(['photo', 'currentEnrollment.classroom'])->get();

            return [[
                'name' => $guardian->name,
                'dni' => $guardian->dni,
                'relationship' => $students->first()?->pivot->relationship ?? 'apoderado',
                'phone' => $guardian->phone,
                'photo' => null,
                'kind' => 'Apoderado',
            ], $students];
        }

        $pickup = AuthorizedPickup::with(['photo', 'student.photo', 'student.currentEnrollment.classroom'])->where('pickup_token', $token)->firstOrFail();

        return [[
            'name' => $pickup->name,
            'dni' => $pickup->dni,
            'relationship' => $pickup->relationship,
            'phone' => $pickup->phone,
            'photo' => $pickup->photo?->url('f_auto,q_auto,w_320,h_320,c_fill,g_face'),
            'kind' => 'Persona autorizada',
        ], collect([$pickup->student])];
    }
}
