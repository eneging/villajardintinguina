<?php

namespace App\Policies;

use App\Enums\ClassroomStaffRole;
use App\Enums\Role;
use App\Models\Classroom;
use App\Models\LearningModule;
use App\Models\User;

class LearningModulePolicy
{
    public function view(User $user, LearningModule $module): bool
    {
        if ($this->manages($user, $module->classroom)) {
            return true;
        }

        if ($user->hasRole(Role::Intern) && $module->classroom->hasStaffMember($user)) {
            return true;
        }

        return $module->isPublished()
            && $user->hasRole(Role::Parent)
            && $module->classroom->hasStudentOf($user);
    }

    public function create(User $user, Classroom $classroom): bool
    {
        return $this->manages($user, $classroom);
    }

    public function update(User $user, LearningModule $module): bool
    {
        return $this->manages($user, $module->classroom);
    }

    public function delete(User $user, LearningModule $module): bool
    {
        return $this->manages($user, $module->classroom);
    }

    /**
     * La administradora gestiona todos los salones; la maestra (titular o auxiliar) solo los suyos.
     */
    private function manages(User $user, Classroom $classroom): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->hasRole(Role::Teacher)
            && ($classroom->hasStaffMember($user, ClassroomStaffRole::Lead)
                || $classroom->hasStaffMember($user, ClassroomStaffRole::Assistant));
    }
}
