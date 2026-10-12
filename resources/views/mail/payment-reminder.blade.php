<x-mail::message>
# Hola, {{ $contact->name }}

Le recordamos amablemente que tiene pagos pendientes en **{{ config('school.name') }}**:

<x-mail::table>
| Concepto | Alumno | Venció | Saldo |
|:--|:--|:--|--:|
@foreach ($charges as $charge)
| {{ $charge->description }} | {{ $charge->student->fullName() }} | {{ $charge->due_on->format('d/m/Y') }} | S/ {{ number_format($charge->balance(), 2) }} |
@endforeach
| | | **Total** | **S/ {{ number_format($total, 2) }}** |
</x-mail::table>

Puede pagar en efectivo en la dirección, por transferencia o Yape. Si ya pagó, suba su voucher en la plataforma para que lo verifiquemos.

<x-mail::button :url="route('payments.index')">
Ver mis pagos
</x-mail::button>

Si ya regularizó su pago, por favor ignore este mensaje. ¡Gracias!

{{ config('school.name') }}
</x-mail::message>
