<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * Días hábiles en Perú: lunes a viernes, sin feriados nacionales.
 * Los feriados fijos están en config('school.holidays'); Jueves y Viernes Santo se calculan.
 */
class PeruCalendar
{
    public static function addBusinessDays(CarbonInterface $from, int $days): CarbonImmutable
    {
        $date = CarbonImmutable::parse($from)->startOfDay();

        while ($days > 0) {
            $date = $date->addDay();

            if (self::isBusinessDay($date)) {
                $days--;
            }
        }

        return $date;
    }

    /**
     * Días hábiles que faltan hasta la fecha (negativo si ya venció).
     */
    public static function businessDaysUntil(CarbonInterface $due, ?CarbonInterface $today = null): int
    {
        $today = CarbonImmutable::parse($today ?? now())->startOfDay();
        $due = CarbonImmutable::parse($due)->startOfDay();

        if ($due->equalTo($today)) {
            return 0;
        }

        $sign = $due->greaterThan($today) ? 1 : -1;
        [$start, $end] = $sign > 0 ? [$today, $due] : [$due, $today];
        $count = 0;

        for ($date = $start->addDay(); $date->lessThanOrEqualTo($end); $date = $date->addDay()) {
            if (self::isBusinessDay($date)) {
                $count++;
            }
        }

        return $sign * $count;
    }

    public static function isBusinessDay(CarbonInterface $date): bool
    {
        return ! $date->isWeekend() && ! self::isHoliday($date);
    }

    public static function isHoliday(CarbonInterface $date): bool
    {
        if (in_array($date->format('m-d'), config('school.holidays', []), true)) {
            return true;
        }

        $easter = CarbonImmutable::create($date->year, 3, 21)->addDays(easter_days($date->year));

        return $date->isSameDay($easter->subDays(3)) || $date->isSameDay($easter->subDays(2));
    }
}
