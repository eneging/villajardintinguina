<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VisitBooking;
use App\Models\VisitSlot;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Horarios de visitas guiadas y las familias que reservaron.
 */
class VisitController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/visits/index', [
            'slots' => VisitSlot::query()
                ->where('starts_at', '>=', today())
                ->with(['bookings' => fn ($q) => $q->orderBy('id')])
                ->orderBy('starts_at')
                ->limit(120)
                ->get()
                ->map(fn (VisitSlot $slot) => [
                    'id' => $slot->id,
                    'starts_at' => $slot->starts_at->format('Y-m-d\TH:i'),
                    'capacity' => $slot->capacity,
                    'bookings' => $slot->bookings->map(fn (VisitBooking $booking) => $booking->only(['id', 'parent_name', 'phone', 'email', 'child_name', 'notes', 'status'])),
                ]),
            'statuses' => EmployeeController::options(VisitBooking::STATUSES),
        ]);
    }

    /** Crea horarios en bloque: un rango de fechas, días de la semana y horas. */
    public function storeSlots(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'from' => ['required', 'date', 'after_or_equal:today'],
            'to' => ['required', 'date', 'after_or_equal:from', 'before:'.now()->addMonths(3)->toDateString()],
            'weekdays' => ['required', 'array', 'min:1'],
            'weekdays.*' => ['integer', 'between:1,6'],
            'times' => ['required', 'array', 'min:1', 'max:6'],
            'times.*' => ['required', 'date_format:H:i'],
            'capacity' => ['required', 'integer', 'min:1', 'max:20'],
        ], [], ['from' => 'desde', 'to' => 'hasta', 'weekdays' => 'días', 'times' => 'horas', 'capacity' => 'cupos']);

        $created = 0;

        foreach (CarbonPeriod::create($data['from'], $data['to']) as $day) {
            if (! in_array($day->dayOfWeekIso, array_map('intval', $data['weekdays']), true)) {
                continue;
            }

            foreach ($data['times'] as $time) {
                $slot = VisitSlot::firstOrCreate(
                    ['starts_at' => CarbonImmutable::parse($day->toDateString().' '.$time)],
                    ['capacity' => $data['capacity']],
                );
                $created += $slot->wasRecentlyCreated ? 1 : 0;
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "Se crearon {$created} horarios de visita."]);

        return back();
    }

    public function destroySlot(VisitSlot $slot): RedirectResponse
    {
        abort_if($slot->activeBookings()->exists(), 422, 'El horario tiene reservas: cancélalas primero.');
        $slot->delete();

        return back();
    }

    public function updateBooking(Request $request, VisitBooking $booking): RedirectResponse
    {
        $booking->update($request->validate(['status' => ['required', Rule::in(array_keys(VisitBooking::STATUSES))]]));

        if ($booking->lead && $booking->status === 'asistio' && in_array($booking->lead->status, ['nuevo', 'contactado'], true)) {
            $booking->lead->update(['status' => 'visita']);
        }

        return back();
    }
}
