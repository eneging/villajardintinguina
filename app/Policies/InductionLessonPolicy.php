<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\InductionLesson;
use App\Models\User;
use App\Services\InductionService;

class InductionLessonPolicy
{
    public function __construct(private readonly InductionService $induction) {}

    public function view(User $user, InductionLesson $lesson): bool
    {
        return $this->induction->canManage($user, $lesson)
            || ($lesson->isPublished() && $this->induction->isFor($user, $lesson));
    }

    public function create(User $user): bool
    {
        return $user->hasRole(Role::Admin, Role::Teacher);
    }

    public function update(User $user, InductionLesson $lesson): bool
    {
        return $this->induction->canManage($user, $lesson);
    }

    public function delete(User $user, InductionLesson $lesson): bool
    {
        return $this->induction->canManage($user, $lesson);
    }

    public function complete(User $user, InductionLesson $lesson): bool
    {
        return $lesson->isPublished() && $this->induction->isFor($user, $lesson);
    }
}
