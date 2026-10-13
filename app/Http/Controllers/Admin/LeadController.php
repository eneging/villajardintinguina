<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Support\CsvExport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Seguimiento de las familias interesadas (admisión / pre-inscripción).
 */
class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(array_keys(Lead::STATUSES))],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $leads = Lead::query()
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($q) => $q
                ->where('parent_name', 'like', "%{$search}%")
                ->orWhere('child_name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/leads/index', [
            'leads' => $leads->through(fn (Lead $lead) => [
                'id' => $lead->id,
                'parent_name' => $lead->parent_name,
                'phone' => $lead->phone,
                'whatsapp' => self::whatsappNumber($lead->phone),
                'email' => $lead->email,
                'child_name' => $lead->child_name,
                'child_age' => $lead->childAge(),
                'level_interest' => $lead->level_interest,
                'message' => $lead->message,
                'status' => $lead->status,
                'source' => $lead->source,
                'notes' => $lead->notes,
                'created_at' => $lead->created_at->toIso8601String(),
                'contacted_at' => $lead->contacted_at?->toIso8601String(),
            ]),
            'counts' => Lead::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'statuses' => EmployeeController::options(Lead::STATUSES),
            'sources' => EmployeeController::options(Lead::SOURCES),
            'filters' => [
                'status' => $filters['status'] ?? '',
                'search' => $filters['search'] ?? '',
            ],
        ]);
    }

    public function export(): StreamedResponse
    {
        return CsvExport::download(
            'admisiones-villajardin-'.today()->format('Y-m-d').'.csv',
            ['Fecha', 'Padre/madre', 'Celular', 'Correo', 'Niño(a)', 'Edad', 'Nivel de interés', 'Estado', 'Origen', 'Mensaje', 'Notas'],
            Lead::query()->latest()->get()->map(fn (Lead $lead) => [
                $lead->created_at->format('d/m/Y H:i'),
                $lead->parent_name,
                $lead->phone,
                $lead->email,
                $lead->child_name,
                $lead->childAge(),
                $lead->level_interest,
                Lead::STATUSES[$lead->status] ?? $lead->status,
                Lead::SOURCES[$lead->source] ?? $lead->source,
                $lead->message,
                $lead->notes,
            ]),
        );
    }

    /** Registro manual (familias que llaman o escriben por WhatsApp). */
    public function store(Request $request): RedirectResponse
    {
        Lead::create($request->validate([
            'parent_name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:20'],
            'child_name' => ['nullable', 'string', 'max:150'],
            'level_interest' => ['nullable', 'string', 'max:60'],
            'message' => ['nullable', 'string', 'max:2000'],
            'source' => ['required', Rule::in(array_keys(Lead::SOURCES))],
        ], [], ['parent_name' => 'nombre', 'phone' => 'celular']));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Familia registrada.']);

        return back();
    }

    public function update(Request $request, Lead $lead): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(array_keys(Lead::STATUSES))],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($data['status'] !== 'nuevo' && ! $lead->contacted_at) {
            $data['contacted_at'] = now();
        }

        $lead->update($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Seguimiento actualizado.']);

        return back();
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $lead->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Solicitud eliminada.']);

        return back();
    }

    /** Número en formato internacional para wa.me (Perú: 51 + 9 dígitos). */
    public static function whatsappNumber(?string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);

        if (strlen($digits) === 9) {
            return '51'.$digits;
        }

        return strlen($digits) >= 11 ? $digits : null;
    }
}
