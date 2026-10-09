<?php

namespace App\Models;

use App\Services\CloudinaryService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Archivo alojado en Cloudinary. Nunca guardamos URLs: se generan al vuelo.
 */
#[Fillable(['public_id', 'resource_type', 'delivery_type', 'format', 'version', 'bytes', 'width', 'height', 'duration', 'original_filename', 'status', 'uploaded_by'])]
class Media extends Model
{
    use SoftDeletes;

    public function url(?string $transformation = null): string
    {
        return app(CloudinaryService::class)->deliveryUrl($this, $transformation);
    }

    /**
     * @return array{id: int, resource_type: string, url: string, thumbnail: string|null, format: string|null, original_filename: string|null}
     */
    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'resource_type' => $this->resource_type,
            'url' => $this->url(match ($this->resource_type) {
                'image' => 'f_auto,q_auto,w_1600,c_limit',
                'video' => 'q_auto',
                default => null,
            }),
            'thumbnail' => match ($this->resource_type) {
                'image' => $this->url('f_auto,q_auto,w_480,c_limit'),
                'video' => app(CloudinaryService::class)->videoPosterUrl($this),
                default => null,
            },
            'format' => $this->format,
            'original_filename' => $this->original_filename,
        ];
    }
}
