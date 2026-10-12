import { Link } from '@inertiajs/react';
import { Images } from 'lucide-react';
import { day } from '@/components/billing/format';
import { Badge } from '@/components/ui/badge';
import { show } from '@/routes/gallery';
import type { AlbumCard as Album } from '@/types';

export function AlbumCard({
    album,
    color = '#16a34a',
    href,
}: {
    album: Album;
    color?: string;
    href?: string;
}) {
    return (
        <Link
            href={href ?? show(album.id)}
            className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div
                className="relative aspect-[4/3] w-full"
                style={{ backgroundColor: `${color}22` }}
            >
                {album.cover?.thumbnail ? (
                    <img
                        src={album.cover.thumbnail}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                    />
                ) : (
                    <div
                        className="flex size-full items-center justify-center text-5xl"
                        aria-hidden
                    >
                        📷
                    </div>
                )}
                <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                    <Images className="size-3" /> {album.items_count}
                </span>
                {!album.published && (
                    <Badge
                        variant="secondary"
                        className="absolute top-2 left-2"
                    >
                        Borrador
                    </Badge>
                )}
            </div>
            <div className="space-y-0.5 p-3">
                <h3 className="font-semibold group-hover:underline">
                    {album.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                    {day(album.date)}
                    {album.classroom &&
                        ` · ${album.classroom.mascot ?? ''} ${album.classroom.name}`}
                </p>
            </div>
        </Link>
    );
}
