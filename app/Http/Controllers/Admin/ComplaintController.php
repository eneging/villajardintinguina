<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ComplaintController as PublicComplaintController;
use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Services\ComplaintBook;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Bandeja de la administradora: plazos y respuestas del Libro de Reclamaciones.
 */
class ComplaintController extends Controller
{
    public function index(): Response
    {
        $complaints = Complaint::query()
            ->orderByRaw('responded_at is not null')
            ->orderBy('response_due_on')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('complaints/index', [
            'complaints' => $complaints->map(fn (Complaint $complaint) => [
                'id' => $complaint->id,
                'code' => $complaint->code,
                'type_label' => $complaint->type->label(),
                'consumer_name' => $complaint->consumer_name,
                'item_description' => $complaint->item_description,
                'created_at' => $complaint->created_at->toIso8601String(),
                'response_due_on' => $complaint->response_due_on->toDateString(),
                'business_days_left' => $complaint->isAnswered() ? null : $complaint->businessDaysLeft(),
                'answered' => $complaint->isAnswered(),
            ]),
        ]);
    }

    public function show(Complaint $complaint): Response
    {
        $complaint->load('responder');

        return Inertia::render('complaints/show', [
            'complaint' => [
                ...PublicComplaintController::present($complaint),
                'responder' => $complaint->responder?->name,
                'business_days_left' => $complaint->isAnswered() ? null : $complaint->businessDaysLeft(),
                'ip_address' => $complaint->ip_address,
            ],
            'provider' => PublicComplaintController::provider(),
        ]);
    }

    public function respond(Request $request, Complaint $complaint, ComplaintBook $book): RedirectResponse
    {
        abort_if($complaint->isAnswered(), 409, 'Esta hoja ya fue respondida.');

        $data = $request->validate(['response' => ['required', 'string', 'min:10', 'max:5000']], [], ['response' => 'respuesta']);

        $book->answer($complaint, $data['response'], $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Respuesta registrada y enviada por correo.']);

        return to_route('admin.complaints.show', $complaint);
    }
}
