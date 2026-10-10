<?php

use App\Mail\ComplaintDeadlines;
use App\Models\Complaint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;

// En el hosting compartido basta un cron cada minuto: php artisan schedule:run

Artisan::command('reclamos:alertar-plazos', function () {
    $due = Complaint::query()
        ->whereNull('responded_at')
        ->orderBy('response_due_on')
        ->get()
        ->filter(fn (Complaint $complaint) => $complaint->businessDaysLeft() <= 3);

    if ($due->isEmpty()) {
        $this->info('No hay reclamos por vencer.');

        return;
    }

    Mail::to(config('school.email'))->send(new ComplaintDeadlines($due->values()));
    $this->info("Aviso enviado: {$due->count()} reclamo(s) por vencer.");
})->purpose('Avisa a la administración de los reclamos que vencen en 3 días hábiles o menos');

Schedule::command('reclamos:alertar-plazos')->weekdays()->dailyAt('08:00');
