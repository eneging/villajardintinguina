<?php

namespace App\Enums;

enum ComplaintType: string
{
    case Claim = 'reclamo';
    case Grievance = 'queja';

    public function label(): string
    {
        return match ($this) {
            self::Claim => 'Reclamo',
            self::Grievance => 'Queja',
        };
    }
}
