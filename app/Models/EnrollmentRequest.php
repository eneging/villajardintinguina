<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'student_id', 'school_year_id', 'level_id', 'child', 'relationship', 'second_guardian', 'emergency_contact', 'pickups', 'documents', 'image_consent', 'rules_accepted_at', 'status', 'admin_notes', 'reviewed_by', 'reviewed_at'])]
class EnrollmentRequest extends Model
{
    public const STATUSES = [
        'enviada' => 'Enviada',
        'observada' => 'Observada',
        'aprobada' => 'Aprobada',
        'rechazada' => 'Rechazada',
    ];

    /** Documentos que se piden y la categoría con que se archivan en Documentos. */
    public const DOCUMENT_TYPES = [
        'dni' => 'DNI',
        'partida' => 'Partida de nacimiento',
        'vacunas' => 'Carné de vacunas',
        'ficha_medica' => 'Ficha médica',
    ];

    protected function casts(): array
    {
        return [
            'child' => 'array',
            'second_guardian' => 'array',
            'emergency_contact' => 'array',
            'pickups' => 'array',
            'documents' => 'array',
            'image_consent' => 'boolean',
            'rules_accepted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return BelongsTo<SchoolYear, $this> */
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    /** @return BelongsTo<Level, $this> */
    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function childName(): string
    {
        return trim(($this->child['first_name'] ?? '').' '.($this->child['last_name'] ?? ''));
    }

    public function isEditable(): bool
    {
        return in_array($this->status, ['enviada', 'observada'], true);
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        $media = Media::query()->whereIn('id', collect($this->documents ?? [])->pluck('media_id'))->get()->keyBy('id');

        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'school_year_id' => $this->school_year_id,
            'year' => $this->schoolYear?->year,
            'level_id' => $this->level_id,
            'level' => $this->level?->name,
            'child' => $this->child,
            'child_name' => $this->childName(),
            'relationship' => $this->relationship,
            'second_guardian' => $this->second_guardian,
            'emergency_contact' => $this->emergency_contact,
            'pickups' => $this->pickups ?? [],
            'documents' => collect($this->documents ?? [])->map(fn ($doc) => [
                ...$doc,
                'label' => self::DOCUMENT_TYPES[$doc['type']] ?? $doc['type'],
                'media' => $media->get($doc['media_id'])?->toClient(),
            ])->values(),
            'image_consent' => $this->image_consent,
            'status' => $this->status,
            'status_label' => self::STATUSES[$this->status] ?? $this->status,
            'admin_notes' => $this->admin_notes,
            'created_at' => $this->created_at->toIso8601String(),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
        ];
    }
}
