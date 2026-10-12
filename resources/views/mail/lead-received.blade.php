<x-mail::message>
# Nueva solicitud de admisión

**{{ $lead->parent_name }}** dejó sus datos en el sitio web.

<x-mail::panel>
Celular: {{ $lead->phone }}
@if ($lead->email)
<br>Correo: {{ $lead->email }}
@endif
@if ($lead->child_name)
<br>Niño(a): {{ $lead->child_name }}{{ $lead->childAge() ? ' — '.$lead->childAge() : '' }}
@endif
@if ($lead->level_interest)
<br>Nivel de interés: {{ $lead->level_interest }}
@endif
</x-mail::panel>

@if ($lead->message)
**Mensaje:**<br>
{!! nl2br(e($lead->message)) !!}
@endif

<x-mail::button :url="route('admin.leads.index')">
Ver solicitudes
</x-mail::button>

{{ config('school.name') }}
</x-mail::message>
