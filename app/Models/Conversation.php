<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Hilo de mensajes de un alumno entre su familia y el personal de su salón.
 */
#[Fillable(['student_id', 'last_message_at'])]
class Conversation extends Model
{
    protected function casts(): array
    {
        return ['last_message_at' => 'datetime'];
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return HasMany<Message, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at')->orderBy('id');
    }

    /** @return HasMany<ConversationRead, $this> */
    public function reads(): HasMany
    {
        return $this->hasMany(ConversationRead::class);
    }

    public function markReadBy(User $user): void
    {
        $this->reads()->updateOrCreate(['user_id' => $user->id], ['last_read_at' => now()]);
    }

    /** ¿Puede esta persona participar en el hilo? */
    public static function canAccess(User $user, Student $student): bool
    {
        return $user->isAdmin()
            || $student->guardians()->whereKey($user->id)->exists()
            || ($student->currentEnrollment?->classroom?->hasStaffMember($user) ?? false);
    }
}
