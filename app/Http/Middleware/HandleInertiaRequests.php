<?php

namespace App\Http\Middleware;

use App\Http\Controllers\NotificationController;
use App\Models\SiteContent;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()
                    ? array_map(fn ($role) => $role->value, $request->user()->roles())
                    : [],
            ],
            'school' => [
                'name' => config('school.name'),
                'whatsapp' => config('school.whatsapp'),
            ],
            // Campanita: avisos sin leer y los más recientes.
            'notifications' => fn () => $request->user() ? [
                'unread' => $request->user()->unreadNotifications()->count(),
                'latest' => $request->user()->notifications()->limit(6)->get()
                    ->map(fn ($notification) => NotificationController::present($notification)),
            ] : null,
            // Datos de contacto del pie de página del sitio público (en caché).
            'contact' => fn () => SiteContent::section('contact'),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
