<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Datos del colegio
    |--------------------------------------------------------------------------
    |
    | Se muestran en el sitio y en la Hoja de Reclamación (identificación del
    | proveedor). Completar con los datos reales en el archivo .env.
    |
    */

    'name' => env('SCHOOL_NAME', 'EP Villa Jardín'),
    'legal_name' => env('SCHOOL_LEGAL_NAME', 'Razón social pendiente'),
    'ruc' => env('SCHOOL_RUC', '00000000000'),
    'address' => env('SCHOOL_ADDRESS', 'Dirección pendiente, Ica'),
    'email' => env('SCHOOL_EMAIL', 'contacto@villajardin.edu.pe'),
    'whatsapp' => env('SCHOOL_WHATSAPP', '51999999999'),

    // Pensiones: día de vencimiento de cada mes, días de tolerancia antes de
    // considerar moroso y meses en que se cobra mensualidad (marzo a diciembre).
    'fee_due_day' => (int) env('SCHOOL_FEE_DUE_DAY', 10),
    'grace_days' => (int) env('SCHOOL_GRACE_DAYS', 0),
    'billing_months' => [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],

    // Asistencia del personal: hora de ingreso y minutos de tolerancia.
    // Si se define la ubicación del colegio, la marcación exige estar dentro del radio (metros).
    'staff_start_time' => env('SCHOOL_STAFF_START_TIME', '07:45'),
    'staff_tolerance_minutes' => (int) env('SCHOOL_STAFF_TOLERANCE', 5),
    'location' => [
        'latitude' => env('SCHOOL_LATITUDE'),
        'longitude' => env('SCHOOL_LONGITUDE'),
        'radius' => (int) env('SCHOOL_LOCATION_RADIUS', 150),
    ],

    // Asistencia de alumnos: hora de entrada (después se marca tardanza).
    'student_start_time' => env('SCHOOL_STUDENT_START_TIME', '08:15'),

    // Planilla (referencial: confirmar con el contador).
    'payroll' => [
        // Descuento por falta injustificada = sueldo / 30 por día.
        'absence_divisor' => 30,
        // Descuento por minuto de tardanza (0 = no se descuenta).
        'late_deduction_per_minute' => (float) env('SCHOOL_LATE_DEDUCTION_PER_MINUTE', 0),
        // Retenciones referenciales.
        'onp_rate' => 13.0,
        'afp_rate' => (float) env('SCHOOL_AFP_RATE', 11.37),
        // Recibo por honorarios: retención de 4.ª categoría si el monto supera el tope.
        'fee_retention_rate' => 8.0,
        'fee_retention_threshold' => 1500,
    ],

    // Primera administradora (la crea `php artisan escuela:instalar`).
    'install' => [
        'admin_email' => env('INSTALL_ADMIN_EMAIL'),
        'admin_name' => env('INSTALL_ADMIN_NAME', 'Administradora'),
        'admin_password' => env('INSTALL_ADMIN_PASSWORD'),
    ],

    // Plazo legal de respuesta del Libro de Reclamaciones (días hábiles).
    'complaint_response_days' => 15,

    // Feriados nacionales fijos (mes-día). Revisar cada año por si el Estado agrega o mueve alguno.
    'holidays' => [
        '01-01', // Año Nuevo
        '05-01', // Día del Trabajo
        '06-07', // Batalla de Arica y Día de la Bandera
        '06-29', // San Pedro y San Pablo
        '07-23', // Día de la Fuerza Aérea del Perú
        '07-28', // Fiestas Patrias
        '07-29', // Fiestas Patrias
        '08-06', // Batalla de Junín
        '08-30', // Santa Rosa de Lima
        '10-08', // Combate de Angamos
        '11-01', // Todos los Santos
        '12-08', // Inmaculada Concepción
        '12-09', // Batalla de Ayacucho
        '12-25', // Navidad
    ],

];
