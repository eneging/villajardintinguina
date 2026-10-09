<?php

namespace App\Enums;

enum ClassroomStaffRole: string
{
    case Lead = 'titular';
    case Assistant = 'auxiliar';
    case Intern = 'practicante';
}
