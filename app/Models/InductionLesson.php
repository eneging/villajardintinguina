<?php

namespace App\Models;

use App\Enums\BlockType;
use App\Enums\InductionAudience;
use App\Enums\ModuleStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable(['author_id', 'title', 'description', 'audience', 'is_required', 'status', 'position', 'cover_media_id'])]
class InductionLesson extends Model
{
    protected function casts(): array
    {
        return [
            'audience' => InductionAudience::class,
            'status' => ModuleStatus::class,
            'is_required' => 'boolean',
        ];
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

    /** @return HasMany<InductionAssignment, $this> */
    public function assignments(): HasMany
    {
        return $this->hasMany(InductionAssignment::class);
    }

    /** @return HasMany<InductionProgress, $this> */
    public function progress(): HasMany
    {
        return $this->hasMany(InductionProgress::class);
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

    public function requiresAcceptance(): bool
    {
        return $this->blocks->contains(fn (ContentBlock $block) => $block->type === BlockType::Confirmation);
    }

    /**
     * Lecciones dirigidas a alguno de estos salones o niveles (o a todos).
     *
     * @param  Builder<InductionLesson>  $query
     * @param  iterable<int>  $classroomIds
     * @param  iterable<int>  $levelIds
     */
    public function scopeTargeting(Builder $query, iterable $classroomIds, iterable $levelIds): void
    {
        $query->whereHas('assignments', fn (Builder $assignment) => $assignment->where(
            fn (Builder $scopes) => $scopes
                ->where('scope', 'general')
                ->orWhere(fn (Builder $q) => $q->where('scope', 'level')->whereIn('scope_id', collect($levelIds)))
                ->orWhere(fn (Builder $q) => $q->where('scope', 'classroom')->whereIn('scope_id', collect($classroomIds))),
        ));
    }
}
