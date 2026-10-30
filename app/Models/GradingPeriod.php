<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['school_year_id', 'name', 'starts_on', 'ends_on', 'published_at'])]
class GradingPeriod extends Model
{
    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<SchoolYear, $this> */
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    /** @return HasMany<ReportCard, $this> */
    public function reportCards(): HasMany
    {
        return $this->hasMany(ReportCard::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'starts_on' => $this->starts_on->toDateString(),
            'ends_on' => $this->ends_on->toDateString(),
            'published' => $this->published_at !== null,
        ];
    }
}
