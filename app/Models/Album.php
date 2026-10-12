<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['classroom_id', 'title', 'description', 'date', 'published', 'consent_confirmed_by', 'consent_confirmed_at', 'created_by'])]
class Album extends Model
{
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'published' => 'boolean',
            'consent_confirmed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Classroom, $this> */
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    /** @return HasMany<AlbumItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(AlbumItem::class)->orderBy('position')->orderBy('id');
    }

    /** @return HasOne<AlbumItem, $this> */
    public function coverItem(): HasOne
    {
        return $this->hasOne(AlbumItem::class)->oldestOfMany('position');
    }

    /** @return BelongsTo<User, $this> */
    public function consentConfirmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consent_confirmed_by');
    }

    /**
     * @return array<string, mixed>
     */
    public function toCard(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'date' => $this->date->toDateString(),
            'published' => $this->published,
            'items_count' => $this->items_count ?? $this->items()->count(),
            'cover' => $this->coverItem?->media?->toClient(),
            'classroom' => $this->relationLoaded('classroom') ? ['id' => $this->classroom->id, 'name' => $this->classroom->name, 'mascot' => $this->classroom->mascot] : null,
        ];
    }
}
