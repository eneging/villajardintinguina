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
