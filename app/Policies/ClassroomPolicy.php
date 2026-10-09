<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Classroom;
use App\Models\User;

class ClassroomPolicy
{
    public function view(User $user, Classroom $classroom): bool
    {
        return $user->isAdmin()
            || $classroom->hasStaffMember($user)
            || ($user->hasRole(Role::Parent) && $classroom->hasStudentOf($user));
    }

    public function uploadMedia(User $user, Classroom $classroom): bool
    {
        return $user->isAdmin()
            || ($user->hasRole(Role::Teacher) && $classroom->hasStaffMember($user));
    }
}
