<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Familia interesada que dejó sus datos en el formulario de admisión.
 */
#[Fillable(['parent_name', 'phone', 'email', 'child_name', 'child_birth_date', 'level_interest', 'message', 'status', 'source', 'notes', 'contacted_at', 'ip_address'])]
class Lead extends Model
{
    public const STATUSES = [
        'nuevo' => 'Nuevo',
        'contactado' => 'Contactado',
        'visita' => 'Visita agendada',
        'matriculado' => 'Matriculado',
        'descartado' => 'Descartado',
    ];

    public const SOURCES = [
        'web' => 'Sitio web',
        'whatsapp' => 'WhatsApp',
        'referido' => 'Referido',
        'redes' => 'Redes sociales',
        'otro' => 'Otro',
    ];

    protected function casts(): array
    {
        return [
            'child_birth_date' => 'date',
            'contacted_at' => 'datetime',
        ];
    }

    /** Edad del niño en texto ("2 años y 3 meses"). */
    public function childAge(): ?string
    {
        if (! $this->child_birth_date) {
            return null;
        }

        $diff = $this->child_birth_date->diff(now());
        $years = $diff->y ? $diff->y.' '.($diff->y === 1 ? 'año' : 'años') : null;
        $months = $diff->m ? $diff->m.' '.($diff->m === 1 ? 'mes' : 'meses') : null;

        return collect([$years, $months])->filter()->implode(' y ') ?: 'Recién nacido';
    }
}
