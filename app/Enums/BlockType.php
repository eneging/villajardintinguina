<?php

namespace App\Enums;

enum BlockType: string
{
    case Text = 'text';
    case Image = 'image';
    case Video = 'video';
    case File = 'file';
    case Activity = 'activity';
}
