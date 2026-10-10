<?php

namespace App\Models;

use App\Enums\InductionScope;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['induction_lesson_id', 'scope', 'scope_id'])]
class InductionAssignment extends Model
{
    protected function casts(): array
    {
        return [
            'scope' => InductionScope::class,
        ];
    }

    /** @return BelongsTo<InductionLesson, $this> */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(InductionLesson::class, 'induction_lesson_id');
    }
}
