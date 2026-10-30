import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { timeAgo } from '@/components/school/notification-bell';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/messages';
import type { MediaItem } from '@/types';

type Thread = {
    student_id: number;
    name: string;
    photo: MediaItem | null;
    classroom: { name: string; mascot: string | null; color: string } | null;
    last_message: {
        body: string;
        author: string | null;
        created_at: string;
    } | null;
    unread: boolean;
};

export default function MessagesIndex({ threads }: { threads: Thread[] }) {
    return (
        <>
            <Head title="Mensajes" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <Heading
                    title="Mensajes"
                    description="Conversa con la maestra o con la familia sobre cada niño, sin compartir números personales."
                />
                {threads.length === 0 ? (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        No hay conversaciones todavía.
                    </p>
                ) : (
                    <ul className="divide-y rounded-2xl border bg-card">
                        {threads.map((thread) => (
                            <li key={thread.student_id}>
                                <Link
                                    href={show(thread.student_id)}
                                    className="flex items-center gap-3 p-4 hover:bg-accent"
                                >
                                    {thread.photo?.thumbnail ? (
                                        <img
                                            src={thread.photo.thumbnail}
                                            alt=""
                                            className="size-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span
                                            className="flex size-12 shrink-0 items-center justify-center rounded-full text-2xl"
                                            style={{
                                                backgroundColor: `${thread.classroom?.color ?? '#16a34a'}26`,
                                            }}
                                            aria-hidden
                                        >
                                            {thread.classroom?.mascot ?? '🧒'}
                                        </span>
                                    )}
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span
                                                className={cn(
                                                    'truncate',
                                                    thread.unread
                                                        ? 'font-bold'
                                                        : 'font-medium',
                                                )}
                                            >
                                                {thread.name}
                                            </span>
                                            {thread.last_message && (
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {timeAgo(
                                                        thread.last_message
                                                            .created_at,
                                                    )}
                                                </span>
                                            )}
                                        </span>
                                        <span
                                            className={cn(
                                                'block truncate text-sm',
                                                thread.unread
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            {thread.last_message
                                                ? `${thread.last_message.author ?? ''}: ${thread.last_message.body}`
                                                : `Salón ${thread.classroom?.name ?? ''} · sin mensajes`}
                                        </span>
                                    </span>
                                    {thread.unread && (
                                        <span
                                            className="size-2.5 shrink-0 rounded-full bg-green-600"
                                            aria-label="Sin leer"
                                        />
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

MessagesIndex.layout = {
    breadcrumbs: [{ title: 'Mensajes', href: index() }],
};
