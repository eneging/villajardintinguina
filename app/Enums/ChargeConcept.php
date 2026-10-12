<?php

namespace App\Enums;

enum ChargeConcept: string
{
    case Enrollment = 'matricula';
    case Monthly = 'mensualidad';
    case Other = 'otro';

    public function label(): string
    {
        return match ($this) {
            self::Enrollment => 'Matrícula',
            self::Monthly => 'Mensualidad',
            self::Other => 'Otro',
        };
    }
}
