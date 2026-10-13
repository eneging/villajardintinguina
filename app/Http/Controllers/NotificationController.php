<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Avisos de la campanita: lista, abrir (marca como leído) y marcar todo.
 */
class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = $request->user()->notifications()->paginate(30);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications->through(fn (DatabaseNotification $notification) => self::present($notification)),
        ]);
    }

    public function open(Request $request, string $notification): RedirectResponse
    {
        $notification = $request->user()->notifications()->findOrFail($notification);
        $notification->markAsRead();

        $url = $notification->data['url'] ?? '/dashboard';

        // Solo rutas internas: evita redirecciones a otros sitios.
        return redirect(str_starts_with($url, '/') && ! str_starts_with($url, '//') ? $url : '/dashboard');
    }

    public function readAll(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    public static function present(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'kind' => $notification->data['kind'] ?? 'info',
            'title' => $notification->data['title'] ?? '',
            'body' => $notification->data['body'] ?? null,
            'read' => $notification->read_at !== null,
            'created_at' => $notification->created_at->toIso8601String(),
        ];
    }
}
