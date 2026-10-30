<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Support\Competencies;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Libreta de notas de un alumno en un periodo (bimestre o trimestre).
 */
#[Fillable(['grading_period_id', 'student_id', 'classroom_id', 'grades', 'comment', 'updated_by'])]
class ReportCard extends Model
{
    use Auditable;

    protected function casts(): array
    {
        return ['grades' => 'array'];
    }

    /** @return BelongsTo<GradingPeriod, $this> */
    public function period(): BelongsTo
    {
        return $this->belongsTo(GradingPeriod::class, 'grading_period_id');
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

    public function gradedCount(): int
    {
        return collect($this->grades ?? [])->filter(fn ($entry) => filled($entry['grade'] ?? null))->count();
    }

    public function isComplete(): bool
    {
        return $this->gradedCount() >= count(Competencies::keys());
    }
}
