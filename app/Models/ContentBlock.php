<?php

namespace App\Models;

use App\Enums\BlockType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * content por tipo:
 *  text:     {body}
 *  image:    {caption}
 *  video:    {caption, youtube_url?}   (si no hay youtube_url se usa media_id)
 *  file:     {caption}
 *  activity: {title, body}
 */
#[Fillable(['type', 'content', 'media_id', 'position'])]
class ContentBlock extends Model
{
    protected function casts(): array
    {
        return [
            'type' => BlockType::class,
            'content' => 'array',
        ];
    }

    /** @return MorphTo<Model, $this> */
    public function blockable(): MorphTo
    {
        return $this->morphTo();
    }

    /** @return BelongsTo<Media, $this> */
    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'content' => $this->content,
            'media' => $this->media?->toClient(),
        ];
    }
}
