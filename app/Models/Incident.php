<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Incidente o atención de enfermería: queda registrado y se avisa a la familia.
 */
#[Fillable(['student_id', 'classroom_id', 'occurred_at', 'type', 'description', 'action_taken', 'medicine', 'reported_by', 'acknowledged_at', 'acknowledged_by'])]
class Incident extends Model
{
    public const TYPES = [
        'golpe' => 'Golpe o caída',
        'fiebre' => 'Fiebre o malestar',
        'medicina' => 'Se le dio medicina',
        'alergia' => 'Reacción alérgica',
        'conducta' => 'Conducta',
        'otro' => 'Otro',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'acknowledged_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return BelongsTo<Classroom, $this> */
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    /** @return BelongsTo<User, $this> */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    /** @return BelongsTo<User, $this> */
    public function acknowledger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'student' => $this->relationLoaded('student') ? ['id' => $this->student->id, 'name' => $this->student->fullName()] : null,
            'classroom' => $this->classroom?->name,
            'occurred_at' => $this->occurred_at->toIso8601String(),
            'type' => $this->type,
            'type_label' => self::TYPES[$this->type] ?? $this->type,
            'description' => $this->description,
            'action_taken' => $this->action_taken,
            'medicine' => $this->medicine,
            'reported_by' => $this->reporter?->name,
            'acknowledged_at' => $this->acknowledged_at?->toIso8601String(),
            'acknowledged_by' => $this->acknowledger?->name,
        ];
    }
}
