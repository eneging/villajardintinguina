<?php

/*
|--------------------------------------------------------------------------
| index.php puente para hosting compartido (cPanel)
|--------------------------------------------------------------------------
|
| Úsalo SOLO si tu hosting obliga a servir el sitio desde public_html y no
| permite apuntar el dominio a la carpeta "public" de Laravel.
|
| Estructura esperada en el servidor:
|   /home/USUARIO/villajardin/     ← todo el proyecto (fuera de la web)
|   /home/USUARIO/public_html/     ← contenido de la carpeta public + este archivo
|
| Si tu carpeta del proyecto tiene otro nombre, cámbialo en $app_path.
|
*/

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$app_path = __DIR__.'/../villajardin';

if (file_exists($maintenance = $app_path.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $app_path.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $app_path.'/bootstrap/app.php';

// Los archivos públicos (build de Vite, favicon, .htaccess) viven en public_html.
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
