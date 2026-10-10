<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['induction_lesson_id', 'user_id', 'completed_at', 'accepted_at', 'ip_address'])]
class InductionProgress extends Model
{
    protected $table = 'induction_progress';

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<InductionLesson, $this> */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(InductionLesson::class, 'induction_lesson_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
