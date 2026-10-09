<?php

namespace Database\Seeders;

use App\Models\Level;
use App\Models\SchoolYear;
use Illuminate\Database\Seeder;

/**
 * Estructura base del colegio: año escolar, niveles y salones.
 * La administradora puede renombrar salones y colores luego.
 */
class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        $year = SchoolYear::updateOrCreate(
            ['year' => (int) now()->format('Y')],
            ['starts_on' => now()->startOfYear()->addMonths(2), 'ends_on' => now()->endOfYear()->subDays(10), 'is_active' => true],
        );

        $levels = [
            ['name' => 'Guardería / Cuna', 'min' => 0, 'max' => 35, 'classroom' => 'Pollitos', 'color' => '#f59e0b', 'mascot' => '🐣'],
            ['name' => 'Inicial 3 años', 'min' => 36, 'max' => 47, 'classroom' => 'Patitos', 'color' => '#0ea5e9', 'mascot' => '🐥'],
            ['name' => 'Inicial 4 años', 'min' => 48, 'max' => 59, 'classroom' => 'Ositos', 'color' => '#22c55e', 'mascot' => '🐻'],
            ['name' => 'Inicial 5 años', 'min' => 60, 'max' => 71, 'classroom' => 'Leoncitos', 'color' => '#ef4444', 'mascot' => '🦁'],
        ];

        foreach ($levels as $position => $data) {
            $level = Level::updateOrCreate(
                ['name' => $data['name']],
                ['min_age_months' => $data['min'], 'max_age_months' => $data['max'], 'position' => $position],
            );

            $year->classrooms()->updateOrCreate(
                ['slug' => str($data['classroom'])->slug()],
                [
                    'level_id' => $level->id,
                    'name' => $data['classroom'],
                    'color' => $data['color'],
                    'mascot' => $data['mascot'],
                ],
            );
        }
    }
}
