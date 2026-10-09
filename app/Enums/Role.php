<?php

namespace App\Enums;

enum Role: string
{
    case Admin = 'admin';
    case Teacher = 'teacher';
    case Intern = 'intern';
    case Parent = 'parent';
    case Student = 'student';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administradora',
            self::Teacher => 'Maestra',
            self::Intern => 'Practicante',
            self::Parent => 'Padre / Madre',
            self::Student => 'Alumno',
        };
    }
}
