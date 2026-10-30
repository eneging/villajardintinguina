<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['classroom_id', 'student_id', 'item', 'received_by'])]
class SupplyDelivery extends Model {}
