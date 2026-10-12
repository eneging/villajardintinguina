<?php

namespace App\Mail;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class DocumentExpirations extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  Collection<int, Document>  $documents
     */
    public function __construct(public Collection $documents) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Documentos por vencer: {$this->documents->count()}");
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.document-expirations');
    }
}
