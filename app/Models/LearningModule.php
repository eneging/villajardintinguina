<?php

namespace App\Models;

use App\Enums\LearningArea;
use App\Enums\ModuleStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable(['classroom_id', 'author_id', 'title', 'area', 'summary', 'goals', 'starts_on', 'ends_on', 'status', 'cover_media_id', 'published_at'])]
class LearningModule extends Model
{
    protected function casts(): array
    {
        return [
            'area' => LearningArea::class,
            'status' => ModuleStatus::class,
            'goals' => 'array',
            'starts_on' => 'date',
            'ends_on' => 'date',
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Classroom, $this> */
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /** @return BelongsTo<Media, $this> */
    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    /** @return MorphMany<ContentBlock, $this> */
    public function blocks(): MorphMany
    {
        return $this->morphMany(ContentBlock::class, 'blockable')->orderBy('position');
    }

    public function isPublished(): bool
    {
        return $this->status === ModuleStatus::Published;
    }
}
