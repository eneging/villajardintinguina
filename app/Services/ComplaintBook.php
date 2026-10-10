<?php

namespace App\Services;

use App\Mail\ComplaintAnswered;
use App\Mail\ComplaintReceived;
use App\Models\Complaint;
use App\Models\User;
use App\Support\PeruCalendar;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class ComplaintBook
{
    /**
     * Registra la hoja con su número correlativo anual y envía la constancia por correo.
     *
     * @param  array<string, mixed>  $data
     */
    public function register(array $data, ?string $ip, ?string $userAgent): Complaint
    {
        $complaint = retry(3, fn () => DB::transaction(function () use ($data, $ip, $userAgent) {
            $year = (int) now()->format('Y');
            $sequence = (int) Complaint::query()->where('year', $year)->lockForUpdate()->max('sequence') + 1;

            return Complaint::create([
                ...$data,
                'year' => $year,
                'sequence' => $sequence,
                'code' => sprintf('%06d-%d', $sequence, $year),
                'response_due_on' => PeruCalendar::addBusinessDays(now(), config('school.complaint_response_days')),
                'ip_address' => $ip,
                'user_agent' => $userAgent ? mb_substr($userAgent, 0, 255) : null,
            ]);
        }), 50, fn ($exception) => $exception instanceof UniqueConstraintViolationException);

        Mail::to($complaint->consumer_email)
            ->bcc(config('school.email'))
            ->send(new ComplaintReceived($complaint));

        return $complaint;
    }

    public function answer(Complaint $complaint, string $response, User $by): void
    {
        $complaint->update([
            'response' => $response,
            'responded_at' => now(),
            'responded_by' => $by->id,
        ]);

        Mail::to($complaint->consumer_email)
            ->bcc(config('school.email'))
            ->send(new ComplaintAnswered($complaint));
    }
}
