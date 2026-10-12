<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\User;
use App\Services\RaffleService;
use App\Support\EventForm;
use Illuminate\Database\Seeder;

/**
 * Evento y sorteo de ejemplo (solo desarrollo).
 */
class EventSeeder extends Seeder
{
    public function run(RaffleService $raffles): void
    {
        $admin = User::where('email', 'admin@villajardin.test')->first();
        $parent = User::where('email', 'padre@villajardin.test')->first();

        if (! $admin || Event::query()->exists()) {
            return;
        }

        $theme = Event::THEMES['cancion-criolla'];
        $event = Event::create([
            'title' => 'Festival de la Canción Criolla',
            'description' => "Los niños presentarán bailes y canciones criollas. ¡Vengan con ropa típica!\nHabrá venta de comidas y un gran sorteo.",
            'date' => now()->addDays(18)->toDateString(),
            'theme' => ['color' => $theme['color'], 'accent' => $theme['accent'], 'emoji' => $theme['emoji']],
            'form_schema' => EventForm::normalize([
                ['label' => '¿Cuántos familiares asistirán?', 'type' => 'number', 'required' => true],
                ['label' => 'Vestimenta del niño', 'type' => 'select', 'required' => true, 'options' => ['Marinera', 'Festejo', 'Vals', 'Aún no sé']],
                ['label' => 'Autorizo que se grabe la presentación', 'type' => 'checkbox', 'required' => false],
            ]),
            'per_student' => true,
            'registration_open' => true,
            'published' => true,
            'created_by' => $admin->id,
        ]);

        $raffle = $raffles->create([
            'event_id' => $event->id,
            'title' => 'Gran sorteo criollo',
            'prize' => 'Canasta de víveres + vale de S/ 100',
            'ticket_price' => 5,
            'total_tickets' => 100,
            'draw_at' => now()->addDays(18)->setTime(12, 0),
        ], $admin);

        foreach ($raffle->tickets()->whereIn('number', [7, 8, 15, 23, 42])->get() as $ticket) {
            $raffles->assign($ticket, $ticket->number <= 8 ? $parent?->id : null, $ticket->number <= 8 ? null : 'Vecino '.$ticket->number, $ticket->number !== 42, $admin);
        }
    }
}
