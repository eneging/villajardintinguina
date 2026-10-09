<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $dni
 * @property string|null $phone
 * @property bool $active
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'dni', 'phone', 'active', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'active' => 'boolean',
            /* @chisel-2fa */
            'two_factor_confirmed_at' => 'datetime',
            /* @end-chisel-2fa */
        ];
    }

    /** @return HasMany<RoleAssignment, $this> */
    public function roleAssignments(): HasMany
    {
        return $this->hasMany(RoleAssignment::class);
    }

    /**
     * @return list<Role>
     */
    public function roles(): array
    {
        return $this->roleAssignments->pluck('role')->values()->all();
    }

    public function hasRole(Role ...$roles): bool
    {
        return $this->roleAssignments->contains(
            fn (RoleAssignment $assignment) => in_array($assignment->role, $roles, true),
        );
    }

    public function assignRole(Role $role): void
    {
        $this->roleAssignments()->firstOrCreate(['role' => $role]);
        $this->unsetRelation('roleAssignments');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(Role::Admin);
    }

    /** @return BelongsToMany<Student, $this> */
    public function children(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'guardians')
            ->withPivot(['relationship', 'is_billing_contact', 'can_pick_up'])
            ->withTimestamps();
    }

    /** @return BelongsToMany<Classroom, $this> */
    public function classrooms(): BelongsToMany
    {
        return $this->belongsToMany(Classroom::class, 'classroom_staff')
            ->withPivot('role')
            ->withTimestamps();
    }
}
