<?php

namespace App\Services;

use App\Mail\PaymentReminder;
use App\Models\Charge;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Recordatorios automáticos a familias con cuotas vencidas: correo siempre que
 * haya email, y WhatsApp Cloud API si está configurado. Respeta un intervalo
 * mínimo entre recordatorios para no saturar a los padres.
 */
class PaymentReminders
{
    public function __construct(
        private readonly BillingService $billing,
        private readonly WhatsAppService $whatsapp,
    ) {}

    /**
     * @return array{sent: int, skipped: int, failed: int}
     */
    public function sendAll(?User $by = null): array
    {
        $result = ['sent' => 0, 'skipped' => 0, 'failed' => 0];
        $interval = (int) config('school.reminder_interval_days', 7);

        foreach ($this->billing->debtors() as $debtor) {
            /** @var User|null $contact */
            $contact = $debtor['contact'];

            if (! $contact || Reminder::where('user_id', $contact->id)->where('kind', 'payment')->where('created_at', '>=', now()->subDays($interval))->exists()) {
                $result['skipped']++;

                continue;
            }

            $sent = false;
            $payload = [
                'total' => $debtor['total'],
                'charge_ids' => $debtor['charges']->pluck('id')->all(),
                'automatic' => true,
            ];

            if ($contact->email && ! str_ends_with($contact->email, '.invalid')) {
                try {
                    Mail::to($contact->email)->send(new PaymentReminder($contact, $debtor['charges'], $debtor['total']));
                    Reminder::create(['user_id' => $contact->id, 'kind' => 'payment', 'channel' => 'email', 'payload' => $payload, 'sent_by' => $by?->id]);
                    $sent = true;
                } catch (Throwable $exception) {
                    report($exception);
                }
            }

            if ($this->whatsapp->isConfigured() && $contact->phone) {
                try {
                    /** @var Charge $oldest */
                    $oldest = $debtor['charges']->first();
                    $this->whatsapp->sendTemplate($contact->phone, config('services.whatsapp.payment_template'), [
                        $contact->name,
                        $oldest->description,
                        $oldest->student->fullName(),
                        number_format($debtor['total'], 2),
                        $oldest->due_on->format('d/m/Y'),
                    ]);
                    Reminder::create(['user_id' => $contact->id, 'kind' => 'payment', 'channel' => 'whatsapp_api', 'payload' => $payload, 'sent_by' => $by?->id]);
                    $sent = true;
                } catch (Throwable $exception) {
                    report($exception);
                }
            }

            $result[$sent ? 'sent' : 'failed']++;
        }

        return $result;
    }
}
