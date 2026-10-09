import { Download, Home } from 'lucide-react';
import { youtubeEmbedUrl } from '@/lib/school';
import type { ContentBlock } from '@/types';

export function BlockRenderer({ block }: { block: ContentBlock }) {
    const { content, media } = block;

    switch (block.type) {
        case 'text':
            return (
                <p className="text-base leading-relaxed whitespace-pre-line text-foreground/90">
                    {content.body}
                </p>
            );

        case 'image':
            return media ? (
                <figure className="space-y-2">
                    <img
                        src={media.url}
                        alt={content.caption ?? ''}
                        loading="lazy"
                        className="w-full rounded-2xl object-cover shadow-sm"
                    />
                    {content.caption && (
                        <figcaption className="text-center text-sm text-muted-foreground">
                            {content.caption}
                        </figcaption>
                    )}
                </figure>
            ) : null;

        case 'video': {
            const embed = content.youtube_url
                ? youtubeEmbedUrl(content.youtube_url)
                : null;

            return (
                <figure className="space-y-2">
                    {embed ? (
                        <iframe
                            src={embed}
                            title={content.caption ?? 'Video'}
                            className="aspect-video w-full rounded-2xl shadow-sm"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : media ? (
                        <video
                            src={media.url}
                            poster={media.thumbnail ?? undefined}
                            controls
                            playsInline
                            preload="metadata"
                            className="aspect-video w-full rounded-2xl bg-black shadow-sm"
                        />
                    ) : null}
                    {content.caption && (
                        <figcaption className="text-center text-sm text-muted-foreground">
                            {content.caption}
                        </figcaption>
                    )}
                </figure>
            );
        }

        case 'file':
            return media ? (
                <a
                    href={media.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:bg-accent"
                >
                    <Download className="size-5 text-primary" />
                    <span className="font-medium">
                        {content.caption ||
                            media.original_filename ||
                            'Descargar archivo'}
                    </span>
                </a>
            ) : null;

        case 'activity':
            return (
                <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/40">
                    <div className="mb-2 flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                        <Home className="size-5" />
                        {content.title || 'Actividad para casa'}
                    </div>
                    <p className="leading-relaxed whitespace-pre-line text-amber-950 dark:text-amber-100">
                        {content.body}
                    </p>
                </div>
            );
    }
}
