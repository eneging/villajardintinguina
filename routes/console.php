<?php

use App\Mail\ComplaintDeadlines;
use App\Models\Complaint;
use App\Services\BillingService;
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

Artisan::command('cuotas:generar {period? : Mes AAAA-MM (por defecto el actual)}', function (BillingService $billing) {
    $period = $this->argument('period') ?? now()->format('Y-m');

    if (! in_array((int) substr($period, 5, 2), config('school.billing_months'), true)) {
        $this->info("{$period} no es mes de cobro de mensualidad.");

        return;
    }

    $this->info("Mensualidades generadas para {$period}: {$billing->generateMonthly($period)}");
})->purpose('Genera la mensualidad del mes para cada alumno matriculado');

Schedule::command('cuotas:generar')->monthlyOn(1, '00:10');
