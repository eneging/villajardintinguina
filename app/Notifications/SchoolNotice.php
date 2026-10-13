<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Aviso dentro de la plataforma (campanita): comunicados, módulos y fotos
 * nuevas, pagos confirmados o rechazados, admisiones y reclamos.
 */
class SchoolNotice extends Notification
{
    use Queueable;

    public function __construct(
        public string $kind,
        public string $title,
        public ?string $body,
        public string $url,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'kind' => $this->kind,
            'title' => $this->title,
            'body' => $this->body,
            'url' => $this->url,
        ];
    }
}
