<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'category', 'unit', 'quantity', 'min_quantity', 'location'])]
class InventoryItem extends Model
{
    public const CATEGORIES = [
        'educativo' => 'Material educativo',
        'limpieza' => 'Limpieza',
        'cocina' => 'Cocina',
        'oficina' => 'Oficina',
        'botiquin' => 'Botiquín',
        'otro' => 'Otro',
    ];

    protected function casts(): array
    {
        return ['quantity' => 'decimal:2', 'min_quantity' => 'decimal:2'];
    }

    /** @return HasMany<InventoryMovement, $this> */
    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class)->latest('id');
    }

    public function isLow(): bool
    {
        return (float) $this->min_quantity > 0 && (float) $this->quantity <= (float) $this->min_quantity;
    }
}
