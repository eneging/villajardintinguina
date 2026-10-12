<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['first_name', 'last_name', 'dni', 'birth_date', 'sex', 'allergies', 'medical_notes', 'image_consent', 'photo_media_id'])]
class Student extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'image_consent' => 'boolean',
        ];
    }

    public function fullName(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /** @return BelongsToMany<User, $this> */
    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'guardians')
            ->withPivot(['relationship', 'is_billing_contact', 'can_pick_up'])
            ->withTimestamps();
    }

    /** @return HasMany<Enrollment, $this> */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /** @return HasOne<Enrollment, $this> */
    public function currentEnrollment(): HasOne
    {
        return $this->hasOne(Enrollment::class)
            ->where('status', 'active')
            ->whereHas('schoolYear', fn ($query) => $query->where('is_active', true));
    }

    /** @return HasMany<AuthorizedPickup, $this> */
    public function authorizedPickups(): HasMany
    {
        return $this->hasMany(AuthorizedPickup::class)->orderBy('name');
    }

    /** @return BelongsTo<Media, $this> */
    public function photo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'photo_media_id');
    }

    /** Edad en texto ("3 años y 2 meses"). */
    public function age(): ?string
    {
        if (! $this->birth_date) {
            return null;
        }

        $diff = $this->birth_date->diff(now());
        $years = $diff->y ? $diff->y.' '.($diff->y === 1 ? 'año' : 'años') : null;
        $months = $diff->m ? $diff->m.' '.($diff->m === 1 ? 'mes' : 'meses') : null;

        return collect([$years, $months])->filter()->implode(' y ') ?: 'Recién nacido';
    }

    /** @return HasMany<Charge, $this> */
    public function charges(): HasMany
    {
        return $this->hasMany(Charge::class);
    }
}
