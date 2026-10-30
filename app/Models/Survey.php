<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Encuesta de satisfacción con preguntas de puntaje (1 a 5), opción o texto.
 */
#[Fillable(['title', 'description', 'audience', 'questions', 'anonymous', 'closes_on', 'published', 'created_by'])]
class Survey extends Model
{
    public const AUDIENCES = ['parents' => 'Familias', 'staff' => 'Personal', 'all' => 'Todos'];

    protected function casts(): array
    {
        return [
            'questions' => 'array',
            'anonymous' => 'boolean',
            'published' => 'boolean',
            'closes_on' => 'date',
        ];
    }

    /** @return HasMany<SurveyResponse, $this> */
    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function isOpen(): bool
    {
        return $this->published && (! $this->closes_on || $this->closes_on->gte(today()));
    }

    public function isFor(User $user): bool
    {
        return match ($this->audience) {
            'parents' => $user->hasRole(Role::Parent),
            'staff' => $user->hasRole(Role::Teacher, Role::Intern, Role::Admin),
            default => true,
        };
    }
}
