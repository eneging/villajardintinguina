<x-mail::message>
# Respuesta a su hoja de reclamación N° {{ $complaint->code }}

Estimado(a) {{ $complaint->consumer_name }}:

En atención a su {{ strtolower($complaint->type->label()) }} registrado el {{ $complaint->created_at->format('d/m/Y') }}, le comunicamos lo siguiente:

<x-mail::panel>
{!! nl2br(e($complaint->response)) !!}
</x-mail::panel>

Fecha de respuesta: {{ $complaint->responded_at->format('d/m/Y') }}

Atentamente,<br>
{{ config('school.legal_name') }} — RUC {{ config('school.ruc') }}<br>
{{ config('school.name') }}
</x-mail::message>
