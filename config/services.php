<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'cloudinary' => [
        // cloudinary://API_KEY:API_SECRET@CLOUD_NAME
        'url' => env('CLOUDINARY_URL'),
        'folder' => env('CLOUDINARY_FOLDER', 'villajardin/local'),
    ],

    // WhatsApp Cloud API (opcional, con costo por mensaje y plantilla aprobada por Meta).
    'whatsapp' => [
        'token' => env('WHATSAPP_TOKEN'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'payment_template' => env('WHATSAPP_PAYMENT_TEMPLATE', 'recordatorio_pago'),
        'language' => env('WHATSAPP_LANGUAGE', 'es'),
        'api_version' => env('WHATSAPP_API_VERSION', 'v21.0'),
    ],

];
