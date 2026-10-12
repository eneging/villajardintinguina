<?php

namespace App\Models;

use App\Enums\InductionAudience;
use App\Enums\Role;
use App\Services\InductionService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['classroom_id', 'author_id', 'title', 'body', 'pinned'])]
class Announcement extends Model
{
    protected function casts(): array
    {
        return [
            'pinned' => 'boolean',
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

    /**
     * Comunicados generales y de los salones vinculados al usuario.
     *
     * @param  Builder<Announcement>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        $induction = app(InductionService::class);
        $classroomIds = collect();

        if ($user->hasRole(Role::Parent)) {
            $classroomIds = $classroomIds->merge($induction->classroomsFor($user, InductionAudience::Parents)->pluck('id'));
        }

        if ($user->hasRole(Role::Teacher, Role::Intern)) {
            $classroomIds = $classroomIds->merge($induction->classroomsFor($user, InductionAudience::Staff)->pluck('id'));
        }

        $query->where(fn (Builder $q) => $q->whereNull('classroom_id')->orWhereIn('classroom_id', $classroomIds->unique()));
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(?User $viewer = null): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'pinned' => $this->pinned,
            'classroom' => $this->classroom ? ['id' => $this->classroom->id, 'name' => $this->classroom->name, 'mascot' => $this->classroom->mascot] : null,
            'author' => $this->author?->name,
            'created_at' => $this->created_at->toIso8601String(),
            'can_delete' => $viewer && ($viewer->isAdmin() || $viewer->id === $this->author_id),
        ];
    }
}
