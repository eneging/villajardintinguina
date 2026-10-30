<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Servicios adicionales y los alumnos que los contratan. Se cobran solos al
 * generar las mensualidades.
 */
class ServiceController extends Controller
{
    public function index(): Response
    {
        $yearId = SchoolYear::current()?->id;

        return Inertia::render('admin/services/index', [
            'services' => Service::query()->orderByDesc('active')->orderBy('name')
                ->with(['enrollments' => fn ($q) => $q->where('school_year_id', $yearId)->where('status', 'active')->with(['student', 'classroom'])])
                ->get()
                ->map(fn (Service $service) => [
                    'id' => $service->id,
                    'name' => $service->name,
                    'description' => $service->description,
                    'monthly_price' => (float) $service->monthly_price,
                    'active' => $service->active,
                    'students' => $service->enrollments->map(fn (Enrollment $enrollment) => [
                        'enrollment_id' => $enrollment->id,
                        'name' => $enrollment->student->fullName(),
                        'classroom' => $enrollment->classroom->name,
                        'price' => $enrollment->pivot->price !== null ? (float) $enrollment->pivot->price : null,
                    ])->sortBy('name')->values(),
                ]),
            'enrollments' => Enrollment::query()->where('school_year_id', $yearId)->where('status', 'active')->with(['student', 'classroom'])->get()
                ->map(fn (Enrollment $enrollment) => ['value' => $enrollment->id, 'label' => "{$enrollment->student->fullName()} ({$enrollment->classroom->name})"])
                ->sortBy('label')->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Service::create($this->validated($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Servicio creado.']);

        return back();
    }

    public function update(Request $request, Service $service): RedirectResponse
    {
        $service->update($this->validated($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Servicio actualizado.']);

        return back();
    }

    public function attach(Request $request, Service $service): RedirectResponse
    {
        $data = $request->validate([
            'enrollment_id' => ['required', 'integer', Rule::exists('enrollments', 'id')->where('school_year_id', SchoolYear::current()?->id)],
            'price' => ['nullable', 'numeric', 'min:0', 'max:99999'],
        ], [], ['enrollment_id' => 'alumno', 'price' => 'precio']);

        $service->enrollments()->syncWithoutDetaching([$data['enrollment_id'] => ['price' => $data['price'] ?? null]]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Alumno agregado al servicio.']);

        return back();
    }

    public function detach(Service $service, Enrollment $enrollment): RedirectResponse
    {
        $service->enrollments()->detach($enrollment->id);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:255'],
            'monthly_price' => ['required', 'numeric', 'min:0', 'max:99999'],
            'active' => ['boolean'],
        ], [], ['name' => 'nombre', 'monthly_price' => 'precio mensual']);
    }
}
