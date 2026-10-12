<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['title', 'description', 'date', 'theme', 'banner_media_id', 'form_schema', 'per_student', 'registration_open', 'published', 'created_by'])]
class Event extends Model
{
    /** Temas listos para fechas festivas peruanas (la administradora puede cambiar colores). */
    public const THEMES = [
        'dia-de-la-madre' => ['name' => 'Día de la Madre', 'color' => '#db2777', 'accent' => '#fce7f3', 'emoji' => '💐'],
        'dia-del-padre' => ['name' => 'Día del Padre', 'color' => '#1d4ed8', 'accent' => '#dbeafe', 'emoji' => '👔'],
        'fiestas-patrias' => ['name' => 'Fiestas Patrias', 'color' => '#dc2626', 'accent' => '#fee2e2', 'emoji' => '🇵🇪'],
        'dia-del-nino' => ['name' => 'Día del Niño', 'color' => '#f59e0b', 'accent' => '#fef3c7', 'emoji' => '🎈'],
        'primavera' => ['name' => 'Primavera', 'color' => '#16a34a', 'accent' => '#dcfce7', 'emoji' => '🌸'],
        'cancion-criolla' => ['name' => 'Día de la Canción Criolla', 'color' => '#7c3aed', 'accent' => '#ede9fe', 'emoji' => '🎶'],
        'aniversario' => ['name' => 'Aniversario del colegio', 'color' => '#0891b2', 'accent' => '#cffafe', 'emoji' => '🎂'],
        'navidad' => ['name' => 'Navidad', 'color' => '#15803d', 'accent' => '#fee2e2', 'emoji' => '🎄'],
        'clausura' => ['name' => 'Clausura', 'color' => '#4f46e5', 'accent' => '#e0e7ff', 'emoji' => '🎓'],
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'theme' => 'array',
            'form_schema' => 'array',
            'per_student' => 'boolean',
            'registration_open' => 'boolean',
            'published' => 'boolean',
        ];
    }

    /** @return BelongsTo<Media, $this> */
    public function banner(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'banner_media_id');
    }

    /** @return HasMany<EventSubmission, $this> */
    public function submissions(): HasMany
    {
        return $this->hasMany(EventSubmission::class);
    }

    /** @return HasMany<Raffle, $this> */
    public function raffles(): HasMany
    {
        return $this->hasMany(Raffle::class);
    }
}
