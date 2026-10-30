import { Head, useForm, usePoll } from '@inertiajs/react';
import { ImagePlus, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MediaUploader } from '@/components/school/media-uploader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { index, show, store } from '@/routes/messages';
import type { MediaItem } from '@/types';

type MessageItem = {
    id: number;
    body: string;
    mine: boolean;
    author: string;
    from_family: boolean;
    media: MediaItem | null;
    created_at: string;
};

type Props = {
    student: {
        id: number;
        name: string;
        photo: MediaItem | null;
        classroom: {
            id: number;
            name: string;
            color: string;
            mascot: string | null;
        } | null;
    };
    participants: { family: string[]; staff: string[] };
    messages: MessageItem[];
    canUpload: boolean;
};

const time = new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
});

export default function Conversation({
    student,
    participants,
    messages,
    canUpload,
}: Props) {
    const end = useRef<HTMLDivElement>(null);
    const [attachment, setAttachment] = useState<MediaItem | null>(null);
    const [attaching, setAttaching] = useState(false);
    const form = useForm({ body: '', media_id: null as number | null });

    // Revisa mensajes nuevos cada 10 segundos mientras la conversación está abierta.
    usePoll(10000, { only: ['messages'] });

    useEffect(() => {
        end.current?.scrollIntoView({ block: 'end' });
    }, [messages.length]);

    return (
        <>
            <Head title={`Mensajes · ${student.name}`} />
            <div className="mx-auto flex h-[calc(100svh-5rem)] w-full max-w-3xl flex-col p-4">
                <header
                    className="rounded-2xl p-4"
                    style={{
                        backgroundColor: `${student.classroom?.color ?? '#16a34a'}22`,
                    }}
                >
                    <h1 className="text-lg font-semibold">
                        {student.classroom?.mascot} {student.name}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Familia: {participants.family.join(', ') || '—'} ·
                        Personal: {participants.staff.join(', ') || '—'}
                    </p>
                </header>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-4">
                    {messages.length === 0 && (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Escribe el primer mensaje. Lo verán la familia y el
                            personal del salón.
                        </p>
                    )}
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                'flex',
                                message.mine ? 'justify-end' : 'justify-start',
                            )}
                        >
                            <div
                                className={cn(
                                    'max-w-[85%] space-y-1 rounded-2xl px-3.5 py-2 text-sm',
                                    message.mine
                                        ? 'rounded-br-sm bg-green-600 text-white'
                                        : 'rounded-bl-sm border bg-card',
                                )}
                            >
                                {!message.mine && (
                                    <p className="text-xs font-semibold opacity-80">
                                        {message.author}
                                        {!message.from_family && ' · colegio'}
                                    </p>
                                )}
                                {message.media && (
                                    <a
                                        href={message.media.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <img
                                            src={
                                                message.media.thumbnail ??
                                                message.media.url
                                            }
                                            alt=""
                                            className="max-h-60 rounded-xl"
                                        />
                                    </a>
                                )}
                                <p className="whitespace-pre-line">
                                    {message.body}
                                </p>
                                <p
                                    className={cn(
                                        'text-right text-[10px]',
                                        message.mine
                                            ? 'text-green-100'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {time.format(new Date(message.created_at))}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={end} />
                </div>

                <form
                    className="space-y-2 border-t pt-3"
                    onSubmit={(event) => {
                        event.preventDefault();

                        if (!form.data.body.trim()) {
                            return;
                        }

                        form.submit(store(student.id), {
                            preserveScroll: true,
                            onSuccess: () => {
                                form.reset();
                                setAttachment(null);
                            },
                        });
                    }}
                >
                    {attachment && (
                        <div className="flex items-center gap-2 text-sm">
                            {attachment.thumbnail && (
                                <img
                                    src={attachment.thumbnail}
                                    alt=""
                                    className="size-12 rounded-lg object-cover"
                                />
                            )}
                            <span className="flex-1 truncate">
                                {attachment.original_filename}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Quitar foto"
                                onClick={() => {
                                    setAttachment(null);
                                    form.setData('media_id', null);
                                }}
                            >
                                <X />
                            </Button>
                        </div>
                    )}
                    {attaching && student.classroom && (
                        <MediaUploader
                            target={{
                                context: 'student',
                                student_id: student.id,
                            }}
                            resourceType="image"
                            label="Elegir foto"
                            onUploaded={(media) => {
                                setAttachment(media);
                                form.setData('media_id', media.id);
                                setAttaching(false);
                            }}
                        />
                    )}
                    <div className="flex items-end gap-2">
                        {canUpload && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Adjuntar foto"
                                onClick={() => setAttaching(!attaching)}
                            >
                                <ImagePlus />
                            </Button>
                        )}
                        <textarea
                            aria-label="Mensaje"
                            rows={2}
                            placeholder="Escribe un mensaje…"
                            className="min-h-11 flex-1 resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            value={form.data.body}
                            onChange={(e) =>
                                form.setData('body', e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    e.currentTarget.form?.requestSubmit();
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            aria-label="Enviar"
                            disabled={form.processing || !form.data.body.trim()}
                        >
                            <Send />
                        </Button>
                    </div>
                    {form.errors.body && (
                        <p className="text-sm text-destructive">
                            {form.errors.body}
                        </p>
                    )}
                </form>
            </div>
        </>
    );
}

Conversation.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Mensajes', href: index() },
        { title: props.student.name, href: show(props.student.id) },
    ],
});
