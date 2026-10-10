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
