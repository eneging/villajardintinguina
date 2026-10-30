<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['conversation_id', 'user_id', 'last_read_at'])]
class ConversationRead extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['last_read_at' => 'datetime'];
    }
}
