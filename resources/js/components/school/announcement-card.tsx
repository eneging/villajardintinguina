import { router, usePage } from '@inertiajs/react';
import { MessageCircle, Pin, Trash2 } from 'lucide-react';
import { day } from '@/components/billing/format';
import { destroy } from '@/routes/announcements';
import type { Announcement } from '@/types';

/** Texto para reenviar el comunicado al grupo de WhatsApp de los padres. */
function shareLink(announcement: Announcement, school: string): string {
    const scope = announcement.classroom
        ? ` · Salón ${announcement.classroom.name}`
        : '';
    const text = `📢 *${announcement.title}*${scope}\n\n${announcement.body}\n\n— ${school}`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function AnnouncementCard({
    announcement,
}: {
    announcement: Announcement;
}) {
    const { school } = usePage().props;

    return (
        <article
            className={`space-y-2 rounded-2xl border bg-card p-4 ${announcement.pinned ? 'border-amber-300 bg-amber-50/60 dark:bg-amber-950/20' : ''}`}
        >
            <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 className="flex items-center gap-1.5 font-semibold">
                        {announcement.pinned && (
                            <Pin
                                className="size-4 text-amber-600"
                                aria-label="Fijado"
                            />
                        )}
                        {announcement.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {announcement.classroom
                            ? `${announcement.classroom.mascot ?? ''} Salón ${announcement.classroom.name}`
                            : '🏫 Todo el colegio'}{' '}
                        · {day(announcement.created_at)}
                        {announcement.author && ` · ${announcement.author}`}
                    </p>
                </div>
                <div className="flex gap-1">
                    <a
                        href={shareLink(announcement, school.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md p-2 text-[#1fb855] hover:bg-accent"
                        aria-label="Compartir por WhatsApp"
                        title="Compartir por WhatsApp"
                    >
                        <MessageCircle className="size-4" />
                    </a>
                    {announcement.can_delete && (
                        <button
                            type="button"
                            className="rounded-md p-2 hover:bg-accent"
                            aria-label="Eliminar comunicado"
                            onClick={() =>
                                confirm('¿Eliminar este comunicado?') &&
                                router.delete(destroy.url(announcement.id), {
                                    preserveScroll: true,
                                })
                            }
                        >
                            <Trash2 className="size-4" />
                        </button>
                    )}
                </div>
            </header>
            <p className="text-sm leading-relaxed whitespace-pre-line">
                {announcement.body}
            </p>
        </article>
    );
}
