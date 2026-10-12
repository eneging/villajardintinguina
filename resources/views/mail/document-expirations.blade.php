<x-mail::message>
# Documentos vencidos o por vencer (próximos 30 días)

<x-mail::table>
| Documento | De | Vence |
|:----------|:---|:------|
@foreach ($documents as $document)
| {{ $document->title }} | {{ $document->ownerName() ?? 'Colegio' }} | {{ $document->expires_on->format('d/m/Y') }}{{ $document->isExpired() ? ' (vencido)' : '' }} |
@endforeach
</x-mail::table>

<x-mail::button :url="route('admin.documents.index', ['expiring' => 1])">
Ver documentos
</x-mail::button>
</x-mail::message>
