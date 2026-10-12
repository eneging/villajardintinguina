import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { day } from '@/components/billing/format';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index as adminEvents } from '@/routes/admin/events';
import { index, show } from '@/routes/events';
import type { EventTheme, MediaItem } from '@/types';

type EventCard = {
    id: number;
    title: string;
    description: string | null;
    date: string;
    theme: EventTheme;
    banner: MediaItem | null;
    published: boolean;
    past: boolean;
};

export default function EventsIndex({ events }: { events: EventCard[] }) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Eventos" />
            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Eventos"
                        description="Celebraciones, actividades y sorteos del colegio."
                    />
                    {auth.roles.includes('admin') && (
                        <Button asChild>
                            <Link href={adminEvents()}>
                                <Plus /> Gestionar eventos
                            </Link>
                        </Button>
                    )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            href={show(event.id)}
                            className={`group overflow-hidden rounded-3xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${event.past ? 'opacity-70' : ''}`}
                            style={{ backgroundColor: event.theme.accent }}
                        >
                            {event.banner ? (
                                <img
                                    src={
                                        event.banner.thumbnail ??
                                        event.banner.url
                                    }
                                    alt=""
                                    className="h-36 w-full object-cover"
                                />
                            ) : (
                                <div
                                    className="flex h-36 items-center justify-center text-6xl"
                                    aria-hidden
                                >
                                    {event.theme.emoji}
                                </div>
                            )}
                            <div className="space-y-1 p-5">
                                <div className="flex flex-wrap gap-1">
                                    {!event.published && (
                                        <Badge variant="secondary">
                                            Borrador
                                        </Badge>
                                    )}
                                    {event.past && (
                                        <Badge variant="outline">Ya pasó</Badge>
                                    )}
                                </div>
                                <h2
                                    className="font-display text-xl font-bold"
                                    style={{ color: event.theme.color }}
                                >
                                    {event.title}
                                </h2>
                                <p className="text-sm font-medium text-slate-700">
                                    {day(event.date)}
                                </p>
                                {event.description && (
                                    <p className="line-clamp-2 text-sm text-slate-600">
                                        {event.description}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
                {events.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Pronto publicaremos los próximos eventos. 🎉
                    </p>
                )}
            </div>
        </>
    );
}

EventsIndex.layout = { breadcrumbs: [{ title: 'Eventos', href: index() }] };
