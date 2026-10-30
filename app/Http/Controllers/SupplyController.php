<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\SupplyDelivery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Control de útiles entregados por cada niño según la lista del salón.
 */
class SupplyController extends Controller
{
    public function show(Classroom $classroom): Response
    {
        Gate::authorize('takeAttendance', $classroom);

        $deliveries = SupplyDelivery::where('classroom_id', $classroom->id)->get()->groupBy('student_id');

        return Inertia::render('supplies/classroom', [
            'classroom' => $classroom->only(['id', 'name', 'color', 'mascot']),
            'items' => collect($classroom->supplies ?? [])->pluck('item')->values(),
            'students' => $classroom->enrollments()->where('status', 'active')->with('student')->get()
                ->map(fn (Enrollment $enrollment) => $enrollment->student)
                ->sortBy(fn (Student $student) => $student->first_name)
                ->values()
                ->map(fn (Student $student) => [
                    'id' => $student->id,
                    'name' => $student->fullName(),
                    'delivered' => $deliveries->get($student->id, collect())->pluck('item')->values(),
                ]),
        ]);
    }

    public function toggle(Request $request, Classroom $classroom): RedirectResponse
    {
        Gate::authorize('takeAttendance', $classroom);

        $data = $request->validate([
            'student_id' => ['required', 'integer', Rule::in($classroom->enrollments()->where('status', 'active')->pluck('student_id'))],
            'item' => ['required', 'string', Rule::in(collect($classroom->supplies ?? [])->pluck('item'))],
            'delivered' => ['required', 'boolean'],
        ]);

        $query = SupplyDelivery::where(['classroom_id' => $classroom->id, 'student_id' => $data['student_id'], 'item' => $data['item']]);

        if ($data['delivered']) {
            $query->firstOr(fn () => SupplyDelivery::create([
                'classroom_id' => $classroom->id, 'student_id' => $data['student_id'], 'item' => $data['item'], 'received_by' => $request->user()->id,
            ]));
        } else {
            $query->delete();
        }

        return back();
    }

    /**
     * Útiles que aún faltan entregar de un alumno (para su ficha).
     *
     * @return list<string>
     */
    public static function pendingFor(Student $student): array
    {
        $classroom = $student->currentEnrollment?->classroom;

        if (! $classroom || empty($classroom->supplies)) {
            return [];
        }

        $delivered = SupplyDelivery::where('classroom_id', $classroom->id)->where('student_id', $student->id)->pluck('item');

        return collect($classroom->supplies)->pluck('item')->diff($delivered)->values()->all();
    }
}
