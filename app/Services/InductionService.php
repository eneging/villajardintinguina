<?php

namespace App\Services;

use App\Enums\InductionAudience;
use App\Enums\InductionScope;
use App\Enums\ModuleStatus;
use App\Enums\Role;
use App\Models\Classroom;
use App\Models\InductionLesson;
use App\Models\SchoolYear;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Decide qué lecciones de inducción le corresponden a cada persona según
 * el salón y nivel de sus hijos (padres) o de los salones donde trabaja (personal).
 */
class InductionService
{
    /**
     * Salones del año activo vinculados al usuario: los de sus hijos o donde trabaja.
     *
     * @return Collection<int, Classroom>
     */
    public function classroomsFor(User $user, InductionAudience $audience): Collection
    {
        $yearId = SchoolYear::current()?->id;

        if ($audience === InductionAudience::Parents) {
            return Classroom::query()
                ->where('school_year_id', $yearId)
                ->whereHas('enrollments', fn (Builder $enrollment) => $enrollment
                    ->where('status', 'active')
                    ->whereHas('student.guardians', fn (Builder $guardian) => $guardian->whereKey($user->id)))
                ->get();
        }

        return $user->classrooms()->where('school_year_id', $yearId)->get();
    }

    /**
     * Audiencias que ve el usuario (un padre que también es maestra ve ambas).
     *
     * @return list<InductionAudience>
     */
    public function audiencesFor(User $user): array
    {
        $audiences = [];

        if ($user->hasRole(Role::Parent)) {
            $audiences[] = InductionAudience::Parents;
        }

        if ($user->hasRole(Role::Teacher, Role::Intern, Role::Admin)) {
            $audiences[] = InductionAudience::Staff;
        }

        return $audiences;
    }

    /**
     * @return Builder<InductionLesson>
     */
    public function lessonsFor(User $user, InductionAudience $audience): Builder
    {
        $classrooms = $this->classroomsFor($user, $audience);

        return InductionLesson::query()
            ->where('status', ModuleStatus::Published)
            ->where('audience', $audience)
            ->targeting($classrooms->pluck('id'), $classrooms->pluck('level_id')->unique());
    }

    public function isFor(User $user, InductionLesson $lesson): bool
    {
        return in_array($lesson->audience, $this->audiencesFor($user), true)
            && $this->lessonsFor($user, $lesson->audience)->whereKey($lesson->id)->exists();
    }

    /**
     * Lecciones publicadas y obligatorias para los padres de un salón.
     *
     * @return Collection<int, InductionLesson>
     */
    public function requiredForClassroom(Classroom $classroom): Collection
    {
        return InductionLesson::query()
            ->where('status', ModuleStatus::Published)
            ->where('audience', InductionAudience::Parents)
            ->where('is_required', true)
            ->targeting([$classroom->id], [$classroom->level_id])
            ->orderBy('position')
            ->get();
    }

    /**
     * Salones que una maestra puede usar como destino de sus lecciones.
     *
     * @return Collection<int, int>
     */
    public function manageableClassroomIds(User $user): Collection
    {
        return Classroom::query()
            ->manageableBy($user)
            ->where('school_year_id', SchoolYear::current()?->id)
            ->pluck('id');
    }

    /**
     * La administradora gestiona todo; la maestra solo lecciones dirigidas
     * exclusivamente a salones que tiene a cargo.
     */
    public function canManage(User $user, InductionLesson $lesson): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if (! $user->hasRole(Role::Teacher) || $lesson->assignments->isEmpty()) {
            return false;
        }

        $allowed = $this->manageableClassroomIds($user);

        return $lesson->assignments->every(
            fn ($assignment) => $assignment->scope === InductionScope::Classroom && $allowed->contains($assignment->scope_id),
        );
    }
}
