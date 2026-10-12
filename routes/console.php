<?php

use App\Mail\ComplaintDeadlines;
use App\Mail\DocumentExpirations;
use App\Models\Complaint;
use App\Models\Document;
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

Artisan::command('documentos:alertar-vencimientos', function () {
    $documents = Document::query()
        ->whereNotNull('expires_on')
        ->where('expires_on', '<=', today()->addDays(30))
        ->orderBy('expires_on')
        ->get();

    if ($documents->isEmpty()) {
        $this->info('No hay documentos por vencer.');

        return;
    }

    Mail::to(config('school.email'))->send(new DocumentExpirations($documents));
    $this->info("Aviso enviado: {$documents->count()} documento(s).");
})->purpose('Avisa a la administración de documentos vencidos o que vencen en 30 días');

Schedule::command('documentos:alertar-vencimientos')->weeklyOn(1, '08:15');
