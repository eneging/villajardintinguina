<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\StaffAttendance;
use App\Models\User;
use App\Support\PeruCalendar;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use InvalidArgumentException;

/**
 * Marcación del personal (entrada/salida) y resúmenes mensuales para la planilla.
 */
class AttendanceService
{
    public function checkIn(User $user, ?float $latitude, ?float $longitude, ?string $ip): StaffAttendance
    {
        $now = CarbonImmutable::now();

        if ($user->staffAttendances()->whereDate('date', $now->toDateString())->exists()) {
            throw new InvalidArgumentException('Ya registraste tu entrada hoy.');
        }

        $this->ensureAtSchool($latitude, $longitude);

        $start = CarbonImmutable::parse($now->toDateString().' '.config('school.staff_start_time'));
        $late = $now->greaterThan($start->addMinutes(config('school.staff_tolerance_minutes')))
            ? (int) $start->diffInMinutes($now)
            : 0;

        return $user->staffAttendances()->create([
            'date' => $now->toDateString(),
            'status' => $late > 0 ? 'tardanza' : 'puntual',
            'check_in_at' => $now,
            'late_minutes' => $late,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'ip_address' => $ip,
            'recorded_by' => $user->id,
        ]);
    }

    public function checkOut(User $user, ?float $latitude, ?float $longitude): StaffAttendance
    {
        $record = $user->staffAttendances()->whereDate('date', today()->toDateString())->first();

        if (! $record || ! $record->check_in_at) {
            throw new InvalidArgumentException('Primero registra tu entrada.');
        }

        if ($record->check_out_at) {
            throw new InvalidArgumentException('Ya registraste tu salida hoy.');
        }

        $this->ensureAtSchool($latitude, $longitude);
        $record->update(['check_out_at' => now()]);

        return $record;
    }

    /**
     * Resumen del mes por persona del personal (maestras y practicantes).
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function monthlySummary(string $month): Collection
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);

        return User::query()
            ->where('active', true)
            ->whereHas('roleAssignments', fn ($q) => $q->whereIn('role', [Role::Teacher->value, Role::Intern->value]))
            ->with(['staffAttendances' => fn ($q) => $q->whereBetween('date', [$start->toDateString(), $start->endOfMonth()->toDateString()])])
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => ['user' => $user, ...$this->stats($user->staffAttendances, $this->businessDays($month))]);
    }

    /**
     * Resumen de una persona en el mes, contando solo desde su fecha de ingreso.
     *
     * @return array<string, mixed>
     */
    public function summaryFor(User $user, string $month, ?CarbonImmutable $from = null): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);
        $records = $user->staffAttendances()
            ->whereBetween('date', [$start->toDateString(), $start->endOfMonth()->toDateString()])
            ->get();

        return $this->stats($records, $this->businessDays($month, $from));
    }

    /**
     * Días hábiles del mes (hasta hoy si es el mes en curso).
     *
     * @return list<string>
     */
    public function businessDays(string $month, ?CarbonImmutable $from = null): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);
        $end = $start->endOfMonth()->min(today());
        $days = [];

        for ($day = $start; $day->lessThanOrEqualTo($end); $day = $day->addDay()) {
            if (PeruCalendar::isBusinessDay($day) && (! $from || $day->greaterThanOrEqualTo($from->startOfDay()))) {
                $days[] = $day->toDateString();
            }
        }

        return $days;
    }

    /**
     * @param  Collection<int, StaffAttendance>  $records
     * @param  list<string>  $businessDays
     * @return array<string, mixed>
     */
    private function stats(Collection $records, array $businessDays): array
    {
        $records = $records->keyBy(fn (StaffAttendance $record) => $record->date->toDateString());

        return [
            'records' => $records,
            'business_days' => count($businessDays),
            'present' => $records->whereIn('status', ['puntual', 'tardanza'])->count(),
            'late' => $records->where('status', 'tardanza')->count(),
            'late_minutes' => (int) $records->sum('late_minutes'),
            'justified' => $records->where('status', 'justificada')->count(),
            'absences' => collect($businessDays)->filter(fn ($day) => ! $records->has($day) || $records[$day]->status === 'falta')->count(),
        ];
    }

    private function ensureAtSchool(?float $latitude, ?float $longitude): void
    {
        $school = config('school.location');

        if (blank($school['latitude']) || blank($school['longitude'])) {
            return; // Ubicación no configurada: no se valida.
        }

        if ($latitude === null || $longitude === null) {
            throw new InvalidArgumentException('Activa la ubicación del celular para marcar tu asistencia.');
        }

        $distance = $this->distanceInMeters((float) $school['latitude'], (float) $school['longitude'], $latitude, $longitude);

        if ($distance > $school['radius']) {
            throw new InvalidArgumentException('Debes estar en el colegio para marcar tu asistencia.');
        }
    }

    private function distanceInMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earth = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earth * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
