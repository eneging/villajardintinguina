<?php

namespace App\Http\Controllers;

use App\Models\StaffAttendance;
use App\Services\AttendanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

/**
 * "Mi asistencia": la maestra o practicante marca su entrada y salida.
 */
class StaffAttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendance) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $month = today()->format('Y-m');

        return Inertia::render('attendance/staff', [
            'today' => $this->present($user->staffAttendances()->whereDate('date', today()->toDateString())->first()),
            'history' => $user->staffAttendances()
                ->where('date', '>=', today()->startOfMonth()->toDateString())
                ->orderByDesc('date')
                ->get()
                ->map(fn (StaffAttendance $record) => $this->present($record)),
            'month' => $month,
            'startTime' => config('school.staff_start_time'),
            'toleranceMinutes' => config('school.staff_tolerance_minutes'),
            'requiresLocation' => filled(config('school.location.latitude')),
        ]);
    }

    public function checkIn(Request $request): RedirectResponse
    {
        return $this->mark($request, fn ($lat, $lng) => $this->attendance->checkIn($request->user(), $lat, $lng, $request->ip()), 'Entrada registrada. ¡Buen día!');
    }

    public function checkOut(Request $request): RedirectResponse
    {
        return $this->mark($request, fn ($lat, $lng) => $this->attendance->checkOut($request->user(), $lat, $lng), 'Salida registrada. ¡Hasta mañana!');
    }

    private function mark(Request $request, callable $action, string $message): RedirectResponse
    {
        $data = $request->validate([
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        try {
            $action(
                isset($data['latitude']) ? (float) $data['latitude'] : null,
                isset($data['longitude']) ? (float) $data['longitude'] : null,
            );
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['attendance' => $exception->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('attendance.staff');
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function present(?StaffAttendance $record): ?array
    {
        return $record ? [
            'date' => $record->date->toDateString(),
            'status' => $record->status,
            'check_in_at' => $record->check_in_at?->format('H:i'),
            'check_out_at' => $record->check_out_at?->format('H:i'),
            'late_minutes' => $record->late_minutes,
            'notes' => $record->notes,
        ] : null;
    }
}
