<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['classroom_id', 'date', 'title', 'description', 'type', 'created_by'])]
class ClassroomActivity extends Model
{
    public const TYPES = [
        'actividad' => 'Actividad',
        'salida' => 'Salida / paseo',
        'celebracion' => 'Celebración',
        'reunion' => 'Reunión de padres',
        'evaluacion' => 'Evaluación',
        'sin_clases' => 'Sin clases',
    ];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    /** @return BelongsTo<Classroom, $this> */
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date->toDateString(),
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'type_label' => self::TYPES[$this->type] ?? $this->type,
        ];
    }
}
