<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Servicio adicional con cobro mensual (movilidad, almuerzo, horario extendido…).
 */
#[Fillable(['name', 'description', 'monthly_price', 'active'])]
class Service extends Model
{
    protected function casts(): array
    {
        return ['active' => 'boolean', 'monthly_price' => 'decimal:2'];
    }

    /** @return BelongsToMany<Enrollment, $this> */
    public function enrollments(): BelongsToMany
    {
        return $this->belongsToMany(Enrollment::class)->withPivot('price')->withTimestamps();
    }
}
