<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

/**
 * Tareas después de subir el código al hosting compartido (sin SSH):
 * migraciones, instalación inicial y cachés. Solo funciona si DEPLOY_TOKEN está
 * definido en .env y la petición trae el mismo token en la cabecera X-Deploy-Token.
 */
class DeployController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $token = (string) config('app.deploy_token');

        abort_if($token === '' || ! hash_equals($token, (string) $request->header('X-Deploy-Token')), 404);

        $steps = [
            ['migrate', ['--force' => true]],
            ['escuela:instalar', []],
            ['optimize:clear', []],
            ['config:cache', []],
            ['route:cache', []],
            ['view:cache', []],
        ];

        $output = [];

        foreach ($steps as [$command, $arguments]) {
            $code = Artisan::call($command, $arguments);
            $output[] = ['command' => $command, 'exit' => $code, 'output' => trim(Artisan::output())];

            if ($code !== 0) {
                return response()->json(['ok' => false, 'steps' => $output], 500);
            }
        }

        return response()->json(['ok' => true, 'steps' => $output]);
    }
}
