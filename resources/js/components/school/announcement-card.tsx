import { router, useForm, usePage } from '@inertiajs/react';
import { MessageCircle, Pencil, Pin, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { day } from '@/components/billing/format';
import InputError from '@/components/input-error';
import { textareaClass } from '@/components/school/block-editor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { destroy, update } from '@/routes/announcements';
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
    const [editing, setEditing] = useState(false);
    const form = useForm({
        title: announcement.title,
        body: announcement.body,
        pinned: announcement.pinned,
    });

    if (editing) {
        return (
            <form
                className="space-y-3 rounded-2xl border bg-card p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.submit(update(announcement.id), {
                        preserveScroll: true,
                        onSuccess: () => setEditing(false),
                    });
                }}
            >
                <Input
                    aria-label="Título"
                    value={form.data.title}
                    onChange={(e) => form.setData('title', e.target.value)}
                />
                <InputError message={form.errors.title} />
                <textarea
                    aria-label="Mensaje"
                    className={textareaClass}
                    value={form.data.body}
                    onChange={(e) => form.setData('body', e.target.value)}
                />
                <InputError message={form.errors.body} />
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={form.data.pinned}
                        onCheckedChange={(c) =>
                            form.setData('pinned', c === true)
                        }
                    />
                    Fijar arriba
                </label>
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            form.reset();
                            setEditing(false);
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        Guardar
                    </Button>
                </div>
            </form>
        );
    }

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
                            aria-label="Editar comunicado"
                            onClick={() => setEditing(true)}
                        >
                            <Pencil className="size-4" />
                        </button>
                    )}
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
