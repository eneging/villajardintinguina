<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['date', 'source', 'description', 'amount', 'created_by'])]
class OtherIncome extends Model
{
    public const SOURCES = [
        'sorteo' => 'Sorteo',
        'evento' => 'Evento',
        'donacion' => 'Donación',
        'otro' => 'Otro',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'amount' => 'decimal:2',
        ];
    }
}
