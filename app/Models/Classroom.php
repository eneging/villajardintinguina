<?php

namespace App\Models;

use App\Enums\ClassroomStaffRole;
use App\Enums\ModuleStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['school_year_id', 'level_id', 'name', 'slug', 'shift', 'capacity', 'color', 'mascot', 'description', 'cover_media_id'])]
class Classroom extends Model
{
    /** @return BelongsTo<SchoolYear, $this> */
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    /** @return BelongsTo<Level, $this> */
    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    /** @return BelongsTo<Media, $this> */
    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    /** @return BelongsToMany<User, $this> */
    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classroom_staff')
            ->withPivot('role')
            ->withTimestamps();
    }

    /** @return HasMany<Enrollment, $this> */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /** @return HasMany<LearningModule, $this> */
    public function learningModules(): HasMany
    {
        return $this->hasMany(LearningModule::class);
    }

    /** @return HasMany<LearningModule, $this> */
    public function publishedModules(): HasMany
    {
        return $this->learningModules()->where('status', ModuleStatus::Published);
    }

    public function hasStaffMember(User $user, ?ClassroomStaffRole $role = null): bool
    {
        $staff = $this->staff()->whereKey($user->id);

        if ($role) {
            $staff->wherePivot('role', $role->value);
        }

        return $staff->exists();
    }

    public function hasStudentOf(User $user): bool
    {
        return $this->enrollments()
            ->where('status', 'active')
            ->whereHas('student.guardians', fn (Builder $query) => $query->whereKey($user->id))
            ->exists();
    }

    /**
     * Salones que el usuario puede gestionar (todos para la administradora).
     *
     * @param  Builder<Classroom>  $query
     */
    public function scopeManageableBy(Builder $query, User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        $query->whereHas('staff', fn (Builder $staff) => $staff
            ->whereKey($user->id)
            ->whereIn('classroom_staff.role', [ClassroomStaffRole::Lead->value, ClassroomStaffRole::Assistant->value]));
    }
}
