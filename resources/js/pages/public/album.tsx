import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { day } from '@/components/billing/format';
import { Lightbox } from '@/components/gallery/lightbox';
import { PublicLayout } from '@/components/school/public-layout';
import { photos } from '@/routes';
import type { AlbumCard, MediaItem } from '@/types';

type Props = {
    album: AlbumCard & {
        items: { id: number; caption: string | null; media: MediaItem }[];
    };
};

export default function PublicAlbum({ album }: Props) {
    const [open, setOpen] = useState<number | null>(null);
    const items = album.items.map((item) => ({ ...item, download_url: null }));

    return (
        <PublicLayout width="wide">
            <Head title={album.title} />
            <div className="space-y-6">
                <Link
                    href={photos()}
                    className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:underline"
                >
                    <ArrowLeft className="size-4" /> Todas las fotos
                </Link>
                <header className="space-y-1">
                    <h1 className="font-display text-4xl font-extrabold text-slate-900">
                        {album.title}
                    </h1>
                    <p className="text-slate-500">
                        {day(album.date)}
                        {album.classroom &&
                            ` · ${album.classroom.mascot ?? ''} ${album.classroom.name}`}
                    </p>
                    {album.description && (
                        <p className="text-slate-600">{album.description}</p>
                    )}
                </header>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((item, index) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setOpen(index)}
                            className="group relative aspect-square overflow-hidden rounded-2xl bg-amber-100"
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
                                <PlayCircle className="absolute inset-0 m-auto size-10 text-white drop-shadow" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
            {open !== null && (
                <Lightbox
                    items={items}
                    index={open}
                    onChange={setOpen}
                    onClose={() => setOpen(null)}
                />
            )}
        </PublicLayout>
    );
}
