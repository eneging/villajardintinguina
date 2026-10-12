import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
};

export function Pagination<T>({ page }: { page: Paginated<T> }) {
    if (page.links.length <= 3) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
                {page.from}–{page.to} de {page.total}
            </span>
            <div className="flex flex-wrap gap-1">
                {page.links.map((link, index) => {
                    const label = link.label
                        .replace('&laquo;', '«')
                        .replace('&raquo;', '»')
                        .replace('Previous', '')
                        .replace('Next', '')
                        .trim();

                    return link.url ? (
                        <Link
                            key={index}
                            href={link.url}
                            preserveScroll
                            className={cn(
                                'rounded-md border px-3 py-1',
                                link.active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent',
                            )}
                        >
                            {label}
                        </Link>
                    ) : (
                        <span
                            key={index}
                            className="rounded-md border px-3 py-1 text-muted-foreground"
                        >
                            {label}
                        </span>
                    );
                })}
            </div>
        </nav>
    );
}
