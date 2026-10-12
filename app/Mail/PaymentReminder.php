<?php

namespace App\Mail;

use App\Models\Charge;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class PaymentReminder extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  Collection<int, Charge>  $charges
     */
    public function __construct(public User $contact, public Collection $charges, public float $total) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Recordatorio de pago — '.config('school.name'));
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.payment-reminder');
    }
}
