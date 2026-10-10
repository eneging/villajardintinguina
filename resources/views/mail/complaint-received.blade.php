<x-mail::message>
# Hoja de reclamación N° {{ $complaint->code }}

Hemos registrado su **{{ strtolower($complaint->type->label()) }}** el {{ $complaint->created_at->format('d/m/Y H:i') }}. Esta es su constancia.

**Proveedor:** {{ config('school.legal_name') }} — RUC {{ config('school.ruc') }}<br>
{{ config('school.address') }}

<x-mail::panel>
**Consumidor:** {{ $complaint->consumer_name }} ({{ $complaint->consumer_document_type }} {{ $complaint->consumer_document_number }})<br>
Domicilio: {{ $complaint->consumer_address }}<br>
Teléfono: {{ $complaint->consumer_phone }} · Correo: {{ $complaint->consumer_email }}
@if ($complaint->is_minor)
<br>Padre, madre o apoderado: {{ $complaint->guardian_name }} ({{ $complaint->guardian_document_number }})
@endif
</x-mail::panel>

**Bien contratado:** {{ ucfirst($complaint->item_type) }} — {{ $complaint->item_description }}
@if ($complaint->amount)
· Monto reclamado: S/ {{ number_format((float) $complaint->amount, 2) }}
@endif

**Detalle:**<br>
{!! nl2br(e($complaint->detail)) !!}

**Pedido:**<br>
{!! nl2br(e($complaint->request)) !!}

Le responderemos a más tardar el **{{ $complaint->response_due_on->format('d/m/Y') }}** (plazo de {{ config('school.complaint_response_days') }} días hábiles).

<small>La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</small>

{{ config('school.name') }}
</x-mail::message>
