<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Controllers\StaffAttendanceController as StaffController;
use App\Models\StaffAttendance;
use App\Models\User;
use App\Services\AttendanceService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Asistencia del personal: resumen del mes y registro manual (faltas justificadas, olvidos de marcación).
 */
class StaffAttendanceController extends Controller
{
    public function index(Request $request, AttendanceService $attendance): Response
    {
        $month = $request->validate(['mes' => ['nullable', 'date_format:Y-m']])['mes'] ?? today()->format('Y-m');

        return Inertia::render('admin/staff-attendance/index', [
            'month' => $month,
            'summary' => $attendance->monthlySummary($month)->map(fn (array $row) => [
                'user' => ['id' => $row['user']->id, 'name' => $row['user']->name],
                'business_days' => $row['business_days'],
                'present' => $row['present'],
                'late' => $row['late'],
                'late_minutes' => $row['late_minutes'],
                'justified' => $row['justified'],
                'absences' => $row['absences'],
                'records' => $row['records']->values()->map(fn (StaffAttendance $record) => StaffController::present($record)),
            ]),
            'statuses' => StaffAttendance::STATUSES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', Rule::exists('role_user', 'user_id')->whereIn('role', [Role::Teacher->value, Role::Intern->value])],
            'date' => ['required', 'date', 'before_or_equal:today'],
            'status' => ['required', Rule::in(StaffAttendance::STATUSES)],
            'check_in' => ['nullable', 'date_format:H:i'],
            'check_out' => ['nullable', 'date_format:H:i'],
            'notes' => ['required', 'string', 'max:255'],
        ], [], ['notes' => 'motivo']);

        $date = CarbonImmutable::parse($data['date']);
        $checkIn = filled($data['check_in'] ?? null) ? $date->setTimeFromTimeString($data['check_in']) : null;
        $start = $date->setTimeFromTimeString(config('school.staff_start_time'));
        $late = $checkIn && $data['status'] === 'tardanza' ? max(0, (int) $start->diffInMinutes($checkIn, false)) : 0;

        $record = StaffAttendance::query()
            ->where('user_id', $data['user_id'])
            ->whereDate('date', $date->toDateString())
            ->first() ?? new StaffAttendance(['user_id' => $data['user_id'], 'date' => $date->toDateString()]);

        $record->fill([
            'status' => $data['status'],
            'check_in_at' => $checkIn,
            'check_out_at' => filled($data['check_out'] ?? null) ? $date->setTimeFromTimeString($data['check_out']) : null,
            'late_minutes' => $late,
            'notes' => $data['notes'],
            'recorded_by' => $request->user()->id,
        ])
            ->save();

        $name = User::find($data['user_id'])->name;
        Inertia::flash('toast', ['type' => 'success', 'message' => "Registro de {$name} guardado."]);

        return back();
    }
}
