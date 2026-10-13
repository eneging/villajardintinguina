<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Announcement;
use App\Models\Classroom;
use App\Models\User;
use App\Notifications\SchoolNotice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

/**
 * Decide a quién avisar dentro de la plataforma. Nunca avisa a quien hizo la acción.
 */
class Notifier
{
    /**
     * @param  iterable<User>|User  $users
     */
    public function send(iterable|User $users, string $kind, string $title, ?string $body, string $url, ?User $except = null): void
    {
        $recipients = collect($users instanceof User ? [$users] : $users)
            ->filter(fn (User $user) => $user->active && $user->id !== $except?->id)
            ->unique('id')
            ->values();

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new SchoolNotice($kind, $title, $body ? Str::limit($body, 140) : null, $url));
        }
    }

    /** Padres con hijos matriculados en el salón (año activo). */
    public function parentsOf(Classroom $classroom): Collection
    {
        return User::query()
            ->whereHas('children.currentEnrollment', fn (Builder $q) => $q->where('classroom_id', $classroom->id))
            ->get();
    }

    /** Padres y personal del salón. */
    public function communityOf(Classroom $classroom): Collection
    {
        return $this->parentsOf($classroom)->concat($classroom->staff()->get());
    }

    public function admins(): Collection
    {
        return User::query()->whereHas('roleAssignments', fn (Builder $q) => $q->where('role', Role::Admin))->get();
    }

    /** Destinatarios de un comunicado: su salón o todos los usuarios activos. */
    public function audienceOf(Announcement $announcement): Collection
    {
        return $announcement->classroom
            ? $this->communityOf($announcement->classroom)->concat($this->admins())
            : User::query()->where('active', true)->get();
    }
}
