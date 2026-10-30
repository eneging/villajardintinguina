<?php

namespace App\Support;

use App\Models\SchoolYear;
use App\Models\Student;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Cumpleaños de los alumnos matriculados en los próximos días.
 */
class Birthdays
{
    /**
     * @param  iterable<int>|null  $classroomIds  null = todo el colegio
     * @return Collection<int, array<string, mixed>>
     */
    public static function upcoming(?iterable $classroomIds = null, int $days = 7): Collection
    {
        $today = CarbonImmutable::today();
        $yearId = SchoolYear::current()?->id;

        return Student::query()
            ->whereNotNull('birth_date')
            ->whereHas('enrollments', fn ($q) => $q
                ->where('school_year_id', $yearId)
                ->where('status', 'active')
                ->when($classroomIds !== null, fn ($q) => $q->whereIn('classroom_id', collect($classroomIds))))
            ->with('currentEnrollment.classroom')
            ->get()
            ->map(function (Student $student) use ($today) {
                $next = $student->birth_date->toImmutable()->setYear($today->year);

                if ($next->lt($today)) {
                    $next = $next->addYear();
                }

                return [
                    'id' => $student->id,
                    'name' => $student->fullName(),
                    'first_name' => $student->first_name,
                    'date' => $next->toDateString(),
                    'days' => (int) $today->diffInDays($next),
                    'turns' => $next->year - $student->birth_date->year,
                    'classroom' => $student->currentEnrollment?->classroom?->only(['id', 'name', 'mascot', 'color']),
                ];
            })
            ->filter(fn (array $birthday) => $birthday['days'] <= $days)
            ->sortBy('days')
            ->values();
    }
}
