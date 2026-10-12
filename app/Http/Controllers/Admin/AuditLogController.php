<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Historial de cambios en pagos, planilla, gastos y reclamos.
 */
class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'type' => ['nullable', Rule::in(array_keys(AuditLog::LABELS))],
            'event' => ['nullable', 'in:created,updated,deleted'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $logs = AuditLog::query()
            ->with('user:id,name')
            ->when($filters['type'] ?? null, fn ($q, $type) => $q->where('auditable_type', $type))
            ->when($filters['event'] ?? null, fn ($q, $event) => $q->where('event', $event))
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->latest('id')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('admin/audit/index', [
            'logs' => $logs->through(fn (AuditLog $log) => [
                'id' => $log->id,
                'event' => $log->event,
                'type' => $log->auditable_type,
                'type_label' => AuditLog::LABELS[$log->auditable_type] ?? $log->auditable_type,
                'record_id' => $log->auditable_id,
                'user' => $log->user?->name,
                'old' => $log->old_values,
                'new' => $log->new_values,
                'ip' => $log->ip_address,
                'at' => $log->created_at->toIso8601String(),
            ]),
            'types' => collect(AuditLog::LABELS)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
            'filters' => [
                'type' => $filters['type'] ?? '',
                'event' => $filters['event'] ?? '',
                'from' => $filters['from'] ?? '',
                'to' => $filters['to'] ?? '',
            ],
        ]);
    }
}
