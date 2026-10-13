import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    BookOpen,
    Camera,
    FileWarning,
    Megaphone,
    PartyPopper,
    UserPlus,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { index, open, readAll } from '@/routes/notifications';
import type { AppNotification } from '@/types';

export const notificationIcons: Record<string, LucideIcon> = {
    announcement: Megaphone,
    module: BookOpen,
    album: Camera,
    payment: Wallet,
    voucher: Wallet,
    lead: UserPlus,
    complaint: FileWarning,
    event: PartyPopper,
};

const relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export function timeAgo(iso: string): string {
    const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000);

    if (Math.abs(minutes) < 60) {
        return relative.format(minutes, 'minute');
    }

    const hours = Math.round(minutes / 60);

    return Math.abs(hours) < 24
        ? relative.format(hours, 'hour')
        : relative.format(Math.round(hours / 24), 'day');
}

export function NotificationRow({
    notification,
}: {
    notification: AppNotification;
}) {
    const Icon = notificationIcons[notification.kind] ?? Bell;

    return (
        <span className="flex w-full gap-3">
            <span
                className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    notification.read
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
                )}
            >
                <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span
                    className={cn(
                        'block text-sm',
                        !notification.read && 'font-semibold',
                    )}
                >
                    {notification.title}
                </span>
                {notification.body && (
                    <span className="block truncate text-xs text-muted-foreground">
                        {notification.body}
                    </span>
                )}
                <span className="block text-xs text-muted-foreground">
                    {timeAgo(notification.created_at)}
                </span>
            </span>
            {!notification.read && (
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-green-600" />
            )}
        </span>
    );
}

/** Campanita con los avisos más recientes. */
export function NotificationBell() {
    const { notifications } = usePage().props;

    if (!notifications) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={`Notificaciones${notifications.unread ? ` (${notifications.unread} sin leer)` : ''}`}
                >
                    <Bell className="size-5" />
                    {notifications.unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                            {notifications.unread > 9
                                ? '9+'
                                : notifications.unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    Notificaciones
                    {notifications.unread > 0 && (
                        <button
                            type="button"
                            className="text-xs font-normal text-muted-foreground hover:underline"
                            onClick={() =>
                                router.post(
                                    readAll.url(),
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Marcar todo como leído
                        </button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.latest.length === 0 && (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                        No tienes notificaciones.
                    </p>
                )}
                {notifications.latest.map((notification) => (
                    <DropdownMenuItem key={notification.id} asChild>
                        <Link
                            href={open(notification.id)}
                            className="cursor-pointer"
                        >
                            <NotificationRow notification={notification} />
                        </Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={index()} className="justify-center text-sm">
                        Ver todas
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
