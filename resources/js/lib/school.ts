import type { Role } from '@/types';

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
});

export function formatRange(start: string, end: string): string {
    const toDate = (value: string) => new Date(`${value}T00:00:00`);

    return `${dateFormatter.format(toDate(start))} – ${dateFormatter.format(toDate(end))}`;
}

/** Fecha local (Perú) en formato AAAA-MM-DD; toISOString usaría UTC. */
export function localToday(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function moduleTiming(
    start: string,
    end: string,
): 'current' | 'upcoming' | 'past' {
    const today = localToday();

    if (today < start) {
        return 'upcoming';
    }

    return today > end ? 'past' : 'current';
}

export function youtubeEmbedUrl(url: string): string | null {
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
    );

    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}

export function hasRole(roles: Role[], ...wanted: Role[]): boolean {
    return wanted.some((role) => roles.includes(role));
}

export const areaColors: Record<string, string> = {
    personal_social: 'bg-pink-100 text-pink-800',
    psicomotriz: 'bg-orange-100 text-orange-800',
    comunicacion: 'bg-sky-100 text-sky-800',
    matematica: 'bg-violet-100 text-violet-800',
    ciencia_tecnologia: 'bg-emerald-100 text-emerald-800',
    ingles: 'bg-indigo-100 text-indigo-800',
    arte: 'bg-yellow-100 text-yellow-800',
};
