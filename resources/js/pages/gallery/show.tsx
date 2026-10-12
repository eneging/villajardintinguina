import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Eye,
    EyeOff,
    Play,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import GalleryController from '@/actions/App/Http/Controllers/GalleryController';
import { day } from '@/components/billing/format';
import { Lightbox } from '@/components/gallery/lightbox';
import type { GalleryItem } from '@/components/gallery/lightbox';
import { MultiUploader } from '@/components/gallery/multi-uploader';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { show as showClassroom } from '@/routes/classrooms';
import { index, show } from '@/routes/gallery';
import type { AlbumCard } from '@/types';

type Props = {
    classroom: {
        id: number;
        name: string;
        color: string;
        mascot: string | null;
    };
    album: AlbumCard & {
        consent_confirmed_by: string | null;
        consent_confirmed_at: string | null;
    };
    items: GalleryItem[];
    canManage: boolean;
    withoutConsent: string[];
    cloudinaryEnabled: boolean;
};

export default function AlbumShow({
    classroom,
    album,
    items,
    canManage,
    withoutConsent,
    cloudinaryEnabled,
}: Props) {
    const [open, setOpen] = useState<number | null>(null);
    const [captions, setCaptions] = useState<Record<number, string>>(() =>
        Object.fromEntries(items.map((i) => [i.id, i.caption ?? ''])),
    );
    const publish = useForm({ published: true, consent_confirmed: false });
    const errors = publish.errors as Record<string, string | undefined>;

    return (
        <>
            <Head title={album.title} />
            <div className="space-y-6 p-4">
                <header
                    className="space-y-2 rounded-3xl p-6"
                    style={{ backgroundColor: `${classroom.color}22` }}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold">{album.title}</h1>
                        {!album.published && (
                            <Badge variant="secondary">
                                Borrador — las familias aún no lo ven
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {classroom.mascot} Salón {classroom.name} ·{' '}
                        {day(album.date)} · {items.length} archivo(s)
                    </p>
                    {album.description && <p>{album.description}</p>}
                    {album.published && album.consent_confirmed_by && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldCheck className="size-3.5" />{' '}
                            {album.consent_confirmed_by} confirmó la
                            autorización de imagen el{' '}
                            {day(album.consent_confirmed_at!)}.
                        </p>
                    )}
                </header>

                {canManage && (
                    <section className="space-y-4 rounded-2xl border bg-card p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <MultiUploader
                                target={{
                                    context: 'classroom',
                                    classroom_id: classroom.id,
                                }}
                                disabled={!cloudinaryEnabled}
                                onUploaded={(media) =>
                                    router.post(
                                        GalleryController.addItems.url(
                                            album.id,
                                        ),
                                        { media_ids: media.map((m) => m.id) },
                                        { preserveScroll: true },
                                    )
                                }
                            />
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    confirm(
                                        '¿Eliminar el álbum y todas sus fotos? No se puede deshacer.',
                                    ) &&
                                    router.delete(
                                        GalleryController.destroy.url(album.id),
                                    )
                                }
                            >
                                <Trash2 /> Eliminar álbum
                            </Button>
                        </div>
                        {!cloudinaryEnabled && (
                            <p className="text-sm text-amber-800">
                                Configura Cloudinary para subir fotos y videos.
                            </p>
                        )}

                        {withoutConsent.length > 0 && (
                            <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                <p>
                                    <strong>Sin autorización de imagen:</strong>{' '}
                                    {withoutConsent.join(', ')}. No deben
                                    aparecer en las fotos ni videos de este
                                    álbum.
                                </p>
                            </div>
                        )}

                        {album.published ? (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.post(
                                        GalleryController.publish.url(album.id),
                                        { published: false },
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                <EyeOff /> Ocultar a las familias
                            </Button>
                        ) : (
                            <form
                                className="flex flex-wrap items-center gap-3 border-t pt-3"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    publish.submit(
                                        GalleryController.publish(album.id),
                                        { preserveScroll: true },
                                    );
                                }}
                            >
                                <label className="flex items-start gap-2 text-sm">
                                    <Checkbox
                                        checked={publish.data.consent_confirmed}
                                        onCheckedChange={(c) =>
                                            publish.setData(
                                                'consent_confirmed',
                                                c === true,
                                            )
                                        }
                                    />
                                    Revisé las fotos: solo aparecen niños con
                                    autorización de imagen.
                                </label>
                                <Button
                                    type="submit"
                                    disabled={publish.processing}
                                >
                                    <Eye /> Publicar para las familias
                                </Button>
                                <InputError
                                    message={
                                        errors.consent_confirmed ??
                                        errors.published
                                    }
                                    className="w-full"
                                />
                            </form>
                        )}
                    </section>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {items.map((item, index) => (
                        <figure
                            key={item.id}
                            className="group relative space-y-1"
                        >
                            <button
                                type="button"
                                className="relative block aspect-square w-full overflow-hidden rounded-xl bg-muted"
                                onClick={() => setOpen(index)}
                                aria-label={`Ver ${item.caption ?? `foto ${index + 1}`}`}
                            >
                                {item.media.thumbnail && (
                                    <img
                                        src={item.media.thumbnail}
                                        alt={item.caption ?? ''}
                                        loading="lazy"
                                        className="size-full object-cover transition group-hover:scale-105"
                                    />
                                )}
                                {item.media.resource_type === 'video' && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <Play className="size-10 rounded-full bg-black/50 p-2 text-white" />
                                    </span>
                                )}
                            </button>
                            {canManage ? (
                                <div className="flex gap-1">
                                    <Input
                                        className="h-8 text-xs"
                                        placeholder="Descripción"
                                        value={captions[item.id] ?? ''}
                                        onChange={(e) =>
                                            setCaptions({
                                                ...captions,
                                                [item.id]: e.target.value,
                                            })
                                        }
                                        onBlur={() =>
                                            router.put(
                                                GalleryController.updateItem.url(
                                                    item.id,
                                                ),
                                                {
                                                    caption:
                                                        captions[item.id] ||
                                                        null,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="rounded-md p-1.5 hover:bg-accent"
                                        aria-label="Eliminar foto"
                                        onClick={() =>
                                            confirm('¿Eliminar esta foto?') &&
                                            router.delete(
                                                GalleryController.destroyItem.url(
                                                    item.id,
                                                ),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                item.caption && (
                                    <figcaption className="truncate text-xs text-muted-foreground">
                                        {item.caption}
                                    </figcaption>
                                )
                            )}
                        </figure>
                    ))}
                </div>
                {items.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Este álbum aún no tiene fotos.
                    </p>
                )}

                {open !== null && (
                    <Lightbox
                        items={items}
                        index={open}
                        onChange={setOpen}
                        onClose={() => setOpen(null)}
                    />
                )}
            </div>
        </>
    );
}

AlbumShow.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: `Salón ${props.classroom.name}`,
            href: showClassroom(props.classroom.id),
        },
        { title: 'Galería', href: index(props.classroom.id) },
        { title: props.album.title, href: show(props.album.id) },
    ],
});
