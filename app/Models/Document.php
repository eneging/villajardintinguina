<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['owner_type', 'owner_id', 'category', 'title', 'media_id', 'expires_on', 'visibility', 'uploaded_by'])]
class Document extends Model
{
    public const CATEGORIES = [
        'institution' => ['Reglamento interno', 'PEI', 'Protocolo', 'Calendario', 'Licencias y permisos', 'Otro'],
        'student' => ['Partida de nacimiento', 'DNI', 'Carné de vacunas', 'Ficha médica', 'Autorización de imagen', 'Contrato de matrícula', 'Otro'],
        'employee' => ['CV', 'Contrato', 'Antecedentes', 'Certificado de salud', 'Títulos y certificados', 'Otro'],
    ];

    protected function casts(): array
    {
        return [
            'expires_on' => 'date',
        ];
    }

    /** @return BelongsTo<Media, $this> */
    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    public function ownerName(): ?string
    {
        return match ($this->owner_type) {
            'student' => Student::find($this->owner_id)?->fullName(),
            'employee' => Employee::find($this->owner_id)?->name,
            default => null,
        };
    }

    /**
     * Documentos que puede ver una persona que no es administradora.
     *
     * @param  Builder<Document>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        $institutional = array_values(array_filter([
            'all',
            $user->hasRole(Role::Parent) ? 'families' : null,
            $user->hasRole(Role::Teacher, Role::Intern) ? 'staff' : null,
        ]));
        $children = $user->children()->pluck('students.id');
        $employeeId = Employee::where('user_id', $user->id)->value('id');

        $query->where(fn (Builder $q) => $q
            ->where(fn (Builder $i) => $i->where('owner_type', 'institution')->whereIn('visibility', $institutional))
            ->orWhere(fn (Builder $s) => $s->where('owner_type', 'student')->where('visibility', 'shared')->whereIn('owner_id', $children))
            ->orWhere(fn (Builder $e) => $e->where('owner_type', 'employee')->where('visibility', 'shared')->where('owner_id', $employeeId ?? 0)));
    }

    public function isExpired(): bool
    {
        return $this->expires_on !== null && $this->expires_on->lt(today());
    }

    public function expiresSoon(int $days = 30): bool
    {
        return $this->expires_on !== null && ! $this->isExpired() && $this->expires_on->lte(today()->addDays($days));
    }
}
