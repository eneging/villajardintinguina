<?php

namespace App\Enums;

/**
 * Áreas curriculares de educación inicial (CNEB) más talleres propios del colegio.
 */
enum LearningArea: string
{
    case PersonalSocial = 'personal_social';
    case Psychomotor = 'psicomotriz';
    case Communication = 'comunicacion';
    case Math = 'matematica';
    case Science = 'ciencia_tecnologia';
    case English = 'ingles';
    case Art = 'arte';

    public function label(): string
    {
        return match ($this) {
            self::PersonalSocial => 'Personal Social',
            self::Psychomotor => 'Psicomotriz',
            self::Communication => 'Comunicación',
            self::Math => 'Matemática',
            self::Science => 'Ciencia y Tecnología',
            self::English => 'Inglés',
            self::Art => 'Arte',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $area) => ['value' => $area->value, 'label' => $area->label()],
            self::cases(),
        );
    }
}
