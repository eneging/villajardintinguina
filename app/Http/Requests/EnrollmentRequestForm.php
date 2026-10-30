<?php

namespace App\Http\Requests;

use App\Models\EnrollmentRequest;
use App\Models\Media;
use App\Models\SchoolYear;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class EnrollmentRequestForm extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $current = SchoolYear::current();

        return [
            'student_id' => ['nullable', 'integer', Rule::in($this->user()->children()->pluck('students.id'))],
            'school_year_id' => ['required', 'integer', Rule::exists('school_years', 'id')->where(fn ($q) => $q->where('year', '>=', $current?->year ?? 0))],
            'level_id' => ['nullable', 'integer', 'exists:levels,id'],
            'child.first_name' => ['required', 'string', 'max:100'],
            'child.last_name' => ['required', 'string', 'max:100'],
            'child.dni' => ['nullable', 'digits:8'],
            'child.birth_date' => ['required', 'date', 'before:today', 'after:'.now()->subYears(7)->toDateString()],
            'child.sex' => ['required', 'in:F,M'],
            'child.blood_type' => ['nullable', 'string', 'max:5'],
            'child.allergies' => ['nullable', 'string', 'max:1000'],
            'child.medical_notes' => ['nullable', 'string', 'max:2000'],
            'child.insurance' => ['nullable', 'string', 'max:100'],
            'relationship' => ['required', 'string', 'max:30'],
            'second_guardian.name' => ['nullable', 'string', 'max:150'],
            'second_guardian.dni' => ['nullable', 'digits:8'],
            'second_guardian.phone' => ['nullable', 'string', 'max:20'],
            'second_guardian.relationship' => ['nullable', 'string', 'max:30'],
            'emergency_contact.name' => ['required', 'string', 'max:150'],
            'emergency_contact.phone' => ['required', 'string', 'max:20'],
            'pickups' => ['array', 'max:6'],
            'pickups.*.name' => ['required', 'string', 'max:150'],
            'pickups.*.dni' => ['required', 'digits:8'],
            'pickups.*.relationship' => ['required', 'string', 'max:40'],
            'pickups.*.phone' => ['nullable', 'string', 'max:20'],
            'documents' => ['array', 'max:8'],
            'documents.*.type' => ['required', Rule::in(array_keys(EnrollmentRequest::DOCUMENT_TYPES))],
            'documents.*.media_id' => ['required', 'integer', 'exists:media,id'],
            'image_consent' => ['boolean'],
            'rules_accepted' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'child.first_name' => 'nombres',
            'child.last_name' => 'apellidos',
            'child.dni' => 'DNI del niño',
            'child.birth_date' => 'fecha de nacimiento',
            'child.sex' => 'sexo',
            'relationship' => 'parentesco',
            'emergency_contact.name' => 'contacto de emergencia',
            'emergency_contact.phone' => 'celular de emergencia',
            'pickups.*.name' => 'nombre',
            'pickups.*.dni' => 'DNI',
            'pickups.*.relationship' => 'parentesco',
            'rules_accepted' => 'aceptación del reglamento',
            'school_year_id' => 'año escolar',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $folder = "matriculas/padres/{$this->user()->id}";
                $cloudinary = app(CloudinaryService::class);
                $ids = collect($this->input('documents', []))->pluck('media_id')->filter();

                foreach (Media::query()->whereKey($ids)->get() as $media) {
                    if (! $cloudinary->belongsToFolder($media->public_id, $folder)) {
                        $validator->errors()->add('documents', 'Uno de los archivos no es válido.');
                    }
                }
            },
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        $data = $this->validated();

        return [
            'student_id' => $data['student_id'] ?? null,
            'school_year_id' => $data['school_year_id'],
            'level_id' => $data['level_id'] ?? null,
            'child' => $data['child'],
            'relationship' => $data['relationship'],
            'second_guardian' => array_filter($data['second_guardian'] ?? []) ?: null,
            'emergency_contact' => $data['emergency_contact'],
            'pickups' => array_values($data['pickups'] ?? []),
            'documents' => array_values($data['documents'] ?? []),
            'image_consent' => (bool) ($data['image_consent'] ?? false),
            'rules_accepted_at' => now(),
        ];
    }
}
