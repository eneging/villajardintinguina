<?php

namespace App\Http\Controllers;

use App\Enums\ComplaintType;
use App\Http\Requests\ComplaintRequest;
use App\Models\Complaint;
use App\Services\ComplaintBook;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Libro de Reclamaciones Virtual: formulario público y constancia.
 */
class ComplaintController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('public/complaints/create', [
            'provider' => self::provider(),
            'today' => now()->toDateString(),
            'responseDays' => config('school.complaint_response_days'),
        ]);
    }

    public function store(ComplaintRequest $request, ComplaintBook $book): RedirectResponse
    {
        $data = $request->safe()->except('accepted');

        if (! $request->boolean('is_minor')) {
            $data['guardian_name'] = null;
            $data['guardian_document_number'] = null;
        }

        $complaint = $book->register($data, $request->ip(), $request->userAgent());

        // La constancia solo se puede ver con el enlace firmado (no por número, para proteger los datos).
        return redirect()->to(URL::temporarySignedRoute('complaints.receipt', now()->addDays(30), $complaint));
    }

    public function receipt(Request $request, Complaint $complaint): Response
    {
        return Inertia::render('public/complaints/receipt', [
            'complaint' => self::present($complaint),
            'provider' => self::provider(),
        ]);
    }

    /**
     * @return array{name: string, legal_name: string, ruc: string, address: string}
     */
    public static function provider(): array
    {
        return [
            'name' => config('school.name'),
            'legal_name' => config('school.legal_name'),
            'ruc' => config('school.ruc'),
            'address' => config('school.address'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function present(Complaint $complaint): array
    {
        return [
            'id' => $complaint->id,
            'code' => $complaint->code,
            'type' => $complaint->type->value,
            'type_label' => $complaint->type->label(),
            'created_at' => $complaint->created_at->toIso8601String(),
            'consumer_name' => $complaint->consumer_name,
            'consumer_document_type' => $complaint->consumer_document_type,
            'consumer_document_number' => $complaint->consumer_document_number,
            'consumer_address' => $complaint->consumer_address,
            'consumer_phone' => $complaint->consumer_phone,
            'consumer_email' => $complaint->consumer_email,
            'is_minor' => $complaint->is_minor,
            'guardian_name' => $complaint->guardian_name,
            'guardian_document_number' => $complaint->guardian_document_number,
            'item_type' => $complaint->item_type,
            'item_description' => $complaint->item_description,
            'amount' => $complaint->amount,
            'detail' => $complaint->detail,
            'request' => $complaint->request,
            'response_due_on' => $complaint->response_due_on->toDateString(),
            'response' => $complaint->response,
            'responded_at' => $complaint->responded_at?->toIso8601String(),
        ];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function typeOptions(): array
    {
        return array_map(fn (ComplaintType $type) => ['value' => $type->value, 'label' => $type->label()], ComplaintType::cases());
    }
}
