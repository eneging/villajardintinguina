<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Persona autorizada a recoger al niño (abuela, tía, movilidad escolar…).
 */
#[Fillable(['student_id', 'name', 'dni', 'relationship', 'phone', 'photo_media_id', 'added_by'])]
class AuthorizedPickup extends Model
{
    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return BelongsTo<Media, $this> */
    public function photo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'photo_media_id');
    }

    public function label(): string
    {
        return "{$this->name} ({$this->relationship}".($this->dni ? ", DNI {$this->dni}" : '').')';
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'dni' => $this->dni,
            'relationship' => $this->relationship,
            'phone' => $this->phone,
            'photo' => $this->photo?->toClient(),
        ];
    }
}
