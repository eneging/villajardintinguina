<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'efectivo';
    case Transfer = 'transferencia';
    case Yape = 'yape';
    case Plin = 'plin';
    case Card = 'tarjeta';
    case Other = 'otro';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Efectivo',
            self::Transfer => 'Transferencia',
            self::Yape => 'Yape',
            self::Plin => 'Plin',
            self::Card => 'Tarjeta / POS',
            self::Other => 'Otro',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $method) => ['value' => $method->value, 'label' => $method->label()], self::cases());
    }
}
