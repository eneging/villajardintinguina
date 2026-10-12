import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { useEffect } from 'react';
import type { MediaItem } from '@/types';

export type GalleryItem = {
    id: number;
    caption: string | null;
    media: MediaItem;
    download_url: string | null;
};

/**
 * Visor a pantalla completa: flechas del teclado, Escape para cerrar y deslizar con botones en el celular.
 */
export function Lightbox({
    items,
    index,
    onChange,
    onClose,
}: {
    items: GalleryItem[];
    index: number;
    onChange: (index: number) => void;
    onClose: () => void;
}) {
    const item = items[index];
    const previous = () => onChange((index - 1 + items.length) % items.length);
    const next = () => onChange((index + 1) % items.length);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowLeft') previous();
            if (event.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    });

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
            role="dialog"
            aria-modal="true"
            aria-label="Foto ampliada"
        >
            <div className="flex items-center justify-between gap-2 p-3 text-sm">
                <span>
                    {index + 1} / {items.length}
                </span>
                <div className="flex gap-1">
                    {item.download_url && (
                        <a
                            href={item.download_url}
                            className="rounded-full p-2 hover:bg-white/10"
                            aria-label="Descargar"
                        >
                            <Download className="size-5" />
                        </a>
                    )}
                    <button
                        type="button"
                        className="rounded-full p-2 hover:bg-white/10"
                        aria-label="Cerrar"
                        onClick={onClose}
                    >
                        <X className="size-5" />
                    </button>
                </div>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
                {item.media.resource_type === 'video' ? (
                    <video
                        key={item.id}
                        src={item.media.url}
                        poster={item.media.thumbnail ?? undefined}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-full max-w-full"
                    />
                ) : (
                    <img
                        key={item.id}
                        src={item.media.url}
                        alt={item.caption ?? ''}
                        className="max-h-full max-w-full object-contain"
                    />
                )}
                {items.length > 1 && (
                    <>
                        <button
                            type="button"
                            className="absolute left-2 rounded-full bg-black/40 p-2 hover:bg-white/20"
                            aria-label="Anterior"
                            onClick={previous}
                        >
                            <ChevronLeft className="size-7" />
                        </button>
                        <button
                            type="button"
                            className="absolute right-2 rounded-full bg-black/40 p-2 hover:bg-white/20"
                            aria-label="Siguiente"
                            onClick={next}
                        >
                            <ChevronRight className="size-7" />
                        </button>
                    </>
                )}
            </div>
            {item.caption && (
                <p className="p-4 text-center text-sm">{item.caption}</p>
            )}
        </div>
    );
}
