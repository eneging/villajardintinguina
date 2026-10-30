<?php

namespace Database\Seeders;

use App\Models\GradingPeriod;
use App\Models\InventoryItem;
use App\Models\Post;
use App\Models\SchoolYear;
use App\Models\Service;
use App\Models\Student;
use App\Models\Survey;
use App\Models\VisitSlot;
use Carbon\CarbonPeriod;
use Illuminate\Database\Seeder;

/**
 * Datos de ejemplo de noticias, encuestas, visitas, servicios, inventario y libretas.
 */
class ExtrasSeeder extends Seeder
{
    public function run(): void
    {
        Post::firstOrCreate(['slug' => 'celebramos-el-dia-de-la-cancion-criolla'], [
            'title' => 'Celebramos el Día de la Canción Criolla',
            'excerpt' => 'Los niños bailaron marinera y festejo con sus familias en el patio del colegio.',
            'body' => "Con mucha alegría celebramos el Día de la Canción Criolla. Cada salón preparó un baile y las familias nos acompañaron.\n\nGracias a todos los papás que ayudaron con los trajes y la decoración.",
            'published_at' => now()->subDays(3),
        ]);
        Post::firstOrCreate(['slug' => 'cinco-consejos-para-el-primer-dia-de-clases'], [
            'title' => 'Cinco consejos para el primer día de clases',
            'excerpt' => 'Cómo ayudar a tu hijo a adaptarse al nido sin lágrimas.',
            'body' => "1. Visita el colegio antes con tu hijo.\n\n2. Despídete con cariño y sin alargar el momento.\n\n3. Cuéntale qué hará durante el día.\n\n4. Sé puntual al recogerlo.\n\n5. Conversa con la maestra sobre cómo le fue.",
            'published_at' => now()->subDays(10),
        ]);

        Survey::firstOrCreate(['title' => 'Encuesta de satisfacción 2026'], [
            'description' => 'Tu opinión nos ayuda a mejorar.',
            'audience' => 'parents',
            'anonymous' => true,
            'published' => true,
            'questions' => [
                ['key' => 'q1_sat', 'label' => '¿Qué tan satisfecho(a) estás con el colegio?', 'type' => 'rating', 'required' => true, 'options' => []],
                ['key' => 'q2_com', 'label' => '¿Cómo calificas la comunicación con la maestra?', 'type' => 'rating', 'required' => true, 'options' => []],
                ['key' => 'q3_rec', 'label' => '¿Nos recomendarías a otras familias?', 'type' => 'choice', 'required' => true, 'options' => ['Sí', 'Tal vez', 'No']],
                ['key' => 'q4_mej', 'label' => '¿Qué podemos mejorar?', 'type' => 'text', 'required' => false, 'options' => []],
            ],
        ]);

        foreach (CarbonPeriod::create(today()->addDay(), today()->addDays(14)) as $day) {
            if ($day->isWeekday()) {
                foreach (['10:00', '15:30'] as $time) {
                    VisitSlot::firstOrCreate(['starts_at' => $day->copy()->setTimeFromTimeString($time)], ['capacity' => 3]);
                }
            }
        }

        $lunch = Service::firstOrCreate(['name' => 'Almuerzo'], ['description' => 'Menú balanceado preparado en el colegio', 'monthly_price' => 180]);
        Service::firstOrCreate(['name' => 'Movilidad escolar'], ['description' => 'Recojo y retorno a casa', 'monthly_price' => 150]);
        Service::firstOrCreate(['name' => 'Horario extendido'], ['description' => 'Guardería hasta las 6:00 p. m.', 'monthly_price' => 120]);

        if ($enrollment = Student::where('dni', '90000001')->first()?->currentEnrollment) {
            $enrollment->services()->syncWithoutDetaching([$lunch->id]);
        }

        foreach ([
            ['Papel bond A4', 'educativo', 'paquete', 6, 3],
            ['Témperas (set)', 'educativo', 'caja', 2, 3],
            ['Alcohol en gel', 'limpieza', 'litro', 4, 2],
            ['Curitas', 'botiquin', 'caja', 1, 2],
        ] as [$name, $category, $unit, $quantity, $min]) {
            InventoryItem::firstOrCreate(['name' => $name], ['category' => $category, 'unit' => $unit, 'quantity' => $quantity, 'min_quantity' => $min]);
        }

        if ($year = SchoolYear::current()) {
            GradingPeriod::firstOrCreate(['school_year_id' => $year->id, 'name' => 'III Trimestre'], [
                'starts_on' => $year->year.'-09-01',
                'ends_on' => $year->year.'-12-18',
            ]);
        }
    }
}
