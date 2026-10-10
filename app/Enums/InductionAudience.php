<?php

namespace App\Enums;

enum InductionAudience: string
{
    case Parents = 'parents';
    case Staff = 'staff';

    public function label(): string
    {
        return match ($this) {
            self::Parents => 'Padres de familia',
            self::Staff => 'Personal (maestras y practicantes)',
        };
    }
}
