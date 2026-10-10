<x-mail::message>
# Reclamos por vencer

Estas hojas del Libro de Reclamaciones vencen pronto o ya vencieron:

<x-mail::table>
| N° | Consumidor | Vence | Días hábiles |
|:---|:-----------|:------|-------------:|
@foreach ($complaints as $complaint)
| {{ $complaint->code }} | {{ $complaint->consumer_name }} | {{ $complaint->response_due_on->format('d/m/Y') }} | {{ $complaint->businessDaysLeft() }} |
@endforeach
</x-mail::table>

<x-mail::button :url="route('admin.complaints.index')">
Ver Libro de Reclamaciones
</x-mail::button>
</x-mail::message>
