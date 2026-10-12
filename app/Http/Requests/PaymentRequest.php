<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Models\Media;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Pago registrado por la administradora o reportado por un padre (con voucher).
 */
class PaymentRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isAdmin = $this->user()->isAdmin();

        return [
            'charge_ids' => ['required', 'array', 'min:1'],
            'charge_ids.*' => ['integer', 'distinct', 'exists:charges,id'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999'],
            'paid_on' => ['required', 'date', 'before_or_equal:today'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'operation_number' => [Rule::requiredIf(! $isAdmin), 'nullable', 'string', 'max:50'],
            'voucher_media_id' => [Rule::requiredIf(! $isAdmin), 'nullable', 'integer', 'exists:media,id'],
            'receipt_type' => ['nullable', 'in:boleta,factura'],
            'receipt_number' => ['nullable', 'string', 'max:30'],
            'receipt_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'charge_ids' => 'cuotas',
            'amount' => 'monto',
            'paid_on' => 'fecha de pago',
            'method' => 'modalidad',
            'operation_number' => 'número de operación',
            'voucher_media_id' => 'foto del voucher',
            'receipt_number' => 'número de comprobante',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                // Los archivos deben venir de la carpeta de pagos permitida a esta persona.
                $folder = $this->user()->isAdmin() ? 'pagos' : "pagos/padres/{$this->user()->id}";
                $cloudinary = app(CloudinaryService::class);
                $ids = array_filter([$this->input('voucher_media_id'), $this->input('receipt_media_id')]);

                foreach (Media::query()->whereKey($ids)->get() as $media) {
                    if (! $cloudinary->belongsToFolder($media->public_id, $folder)) {
                        $validator->errors()->add('voucher_media_id', 'El archivo no es válido para este pago.');
                    }
                }

                if (! $this->user()->isAdmin() && $this->filled('receipt_media_id')) {
                    $validator->errors()->add('receipt_media_id', 'Solo la administración sube comprobantes.');
                }
            },
        ];
    }
}
