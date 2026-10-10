<?php

namespace App\Mail;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class ComplaintDeadlines extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  Collection<int, Complaint>  $complaints
     */
    public function __construct(public Collection $complaints) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Libro de Reclamaciones: {$this->complaints->count()} por vencer");
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.complaint-deadlines');
    }
}
