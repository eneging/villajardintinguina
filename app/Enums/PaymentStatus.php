<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Confirmed = 'confirmed';
    case Pending = 'pending'; // voucher subido por el padre, por verificar
    case Rejected = 'rejected';
}
