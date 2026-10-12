<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    /** Ficha: administradora, apoderados y el personal de su salón actual. */
    public function view(User $user, Student $student): bool
    {
        return $user->isAdmin()
            || $this->isGuardian($user, $student)
            || ($student->currentEnrollment?->classroom?->hasStaffMember($user) ?? false);
    }

    /** Datos sensibles de la familia (pagos, documentos, autorizados). */
    public function manage(User $user, Student $student): bool
    {
        return $user->isAdmin() || $this->isGuardian($user, $student);
    }

    public function updatePhoto(User $user, Student $student): bool
    {
        return $this->manage($user, $student)
            || ($student->currentEnrollment?->classroom?->hasStaffMember($user) ?? false);
    }

    private function isGuardian(User $user, Student $student): bool
    {
        return $student->guardians()->whereKey($user->id)->exists();
    }
}
