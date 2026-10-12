<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Album;
use App\Models\User;

class AlbumPolicy
{
    public function view(User $user, Album $album): bool
    {
        if ($this->update($user, $album) || $album->classroom->hasStaffMember($user)) {
            return true;
        }

        return $album->published && $user->hasRole(Role::Parent) && $album->classroom->hasStudentOf($user);
    }

    /**
     * Administradora o maestra del salón (titular o auxiliar).
     */
    public function update(User $user, Album $album): bool
    {
        return $user->can('uploadMedia', $album->classroom);
    }

    public function delete(User $user, Album $album): bool
    {
        return $this->update($user, $album);
    }
}
