import { Head, Link, router } from '@inertiajs/react';
import { CheckCheck } from 'lucide-react';
import Heading from '@/components/heading';
import { NotificationRow } from '@/components/school/notification-bell';
import { Pagination } from '@/components/school/pagination';
import type { Paginated } from '@/components/school/pagination';
import { Button } from '@/components/ui/button';
import { index, open, readAll } from '@/routes/notifications';
import type { AppNotification } from '@/types';

export default function Notifications({
    notifications,
}: {
    notifications: Paginated<AppNotification>;
}) {
    const unread = notifications.data.some((n) => !n.read);

    return (
        <>
            <Head title="Notificaciones" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Notificaciones"
                        description="Comunicados, módulos, fotos, pagos y avisos de la plataforma."
                    />
                    {unread && (
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.post(
                                    readAll.url(),
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            <CheckCheck /> Marcar todo como leído
                        </Button>
                    )}
                </div>
                {notifications.data.length === 0 ? (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        No tienes notificaciones.
                    </p>
                ) : (
                    <ul className="divide-y rounded-2xl border bg-card">
                        {notifications.data.map((notification) => (
                            <li key={notification.id}>
                                <Link
                                    href={open(notification.id)}
                                    className="block p-4 hover:bg-accent"
                                >
                                    <NotificationRow
                                        notification={notification}
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
                <Pagination page={notifications} />
            </div>
        </>
    );
}

Notifications.layout = {
    breadcrumbs: [{ title: 'Notificaciones', href: index() }],
};
