<?php

namespace App\Http\Controllers\Admin;

use App\Models\Document;

class DocumentPresenter
{
    /**
     * @return array<string, mixed>
     */
    public static function row(Document $document): array
    {
        return [
            'id' => $document->id,
            'owner_type' => $document->owner_type,
            'owner' => $document->ownerName(),
            'category' => $document->category,
            'title' => $document->title,
            'expires_on' => $document->expires_on?->toDateString(),
            'expired' => $document->isExpired(),
            'expires_soon' => $document->expiresSoon(),
            'visibility' => $document->visibility,
        ];
    }
}
