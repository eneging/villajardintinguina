<?php

namespace App\Http\Requests;

use App\Enums\ComplaintType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ComplaintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // El Libro de Reclamaciones es público.
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ComplaintType::class)],
            'consumer_name' => ['required', 'string', 'max:150'],
            'consumer_document_type' => ['required', 'in:DNI,CE,Pasaporte'],
            'consumer_document_number' => ['required', 'string', 'max:20', Rule::when($this->input('consumer_document_type') === 'DNI', 'digits:8')],
            'consumer_address' => ['required', 'string', 'max:255'],
            'consumer_phone' => ['required', 'string', 'max:20'],
            'consumer_email' => ['required', 'email', 'max:150'],
            'is_minor' => ['boolean'],
            'guardian_name' => ['required_if_accepted:is_minor', 'nullable', 'string', 'max:150'],
            'guardian_document_number' => ['required_if_accepted:is_minor', 'nullable', 'string', 'max:20'],
            'item_type' => ['required', 'in:producto,servicio'],
            'item_description' => ['required', 'string', 'max:255'],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'detail' => ['required', 'string', 'max:5000'],
            'request' => ['required', 'string', 'max:3000'],
            'accepted' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'type' => 'tipo',
            'consumer_name' => 'nombre completo',
            'consumer_document_type' => 'tipo de documento',
            'consumer_document_number' => 'número de documento',
            'consumer_address' => 'domicilio',
            'consumer_phone' => 'teléfono',
            'consumer_email' => 'correo electrónico',
            'guardian_name' => 'nombre del padre, madre o apoderado',
            'guardian_document_number' => 'documento del padre, madre o apoderado',
            'item_description' => 'descripción',
            'amount' => 'monto reclamado',
            'detail' => 'detalle',
            'request' => 'pedido',
            'accepted' => 'declaración',
        ];
    }
}
