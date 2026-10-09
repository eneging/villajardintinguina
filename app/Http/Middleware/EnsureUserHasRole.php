<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Uso en rutas: ->middleware('role:admin,teacher')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        abort_unless(
            $user && $user->active && $user->hasRole(...array_map(Role::from(...), $roles)),
            403,
            'No tienes permiso para entrar a esta sección.',
        );

        return $next($request);
    }
}
