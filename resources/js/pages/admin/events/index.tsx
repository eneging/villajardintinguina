import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Ticket } from 'lucide-react';
import RaffleController from '@/actions/App/Http/Controllers/Admin/RaffleController';
import { day, money } from '@/components/billing/format';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { create, index, submissions } from '@/routes/admin/events';
import { show as showRaffle } from '@/routes/admin/raffles';
import { show } from '@/routes/events';
import type { EventTheme } from '@/types';

type EventRow = {
    id: number;
    title: string;
    date: string;
    theme: EventTheme;
    published: boolean;
    registration_open: boolean;
    submissions_count: number;
    raffles_count: number;
};

type RaffleRow = {
    id: number;
    title: string;
    prize: string;
    status: string;
    total_tickets: number;
    sold_count: number;
    ticket_price: number;
};

export default function EventsAdmin({
    events,
    raffles,
}: {
    events: EventRow[];
    raffles: RaffleRow[];
}) {
    const form = useForm({
        event_id: '' as number | '',
        title: '',
        prize: '',
        ticket_price: '5',
        total_tickets: '100',
        draw_at: '',
    });

    return (
        <>
            <Head title="Eventos y sorteos" />
            <div className="space-y-8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Eventos y sorteos"
                        description="Fechas festivas con su propio tema, formularios para las familias y sorteos con tickets."
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> Nuevo evento
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="overflow-hidden rounded-2xl border bg-card"
                        >
                            <Link
                                href={show(event.id)}
                                className="flex items-center gap-3 p-4"
                                style={{ backgroundColor: event.theme.accent }}
                            >
                                <span className="text-4xl" aria-hidden>
                                    {event.theme.emoji}
                                </span>
                                <span>
                                    <span
                                        className="block font-semibold"
                                        style={{ color: event.theme.color }}
                                    >
                                        {event.title}
                                    </span>
                                    <span className="text-sm text-slate-600">
                                        {day(event.date)}
                                    </span>
                                </span>
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 p-4 text-sm">
                                {!event.published && (
                                    <Badge variant="secondary">Borrador</Badge>
                                )}
                                {event.published &&
                                    !event.registration_open && (
                                        <Badge variant="outline">
                                            Inscripciones cerradas
                                        </Badge>
                                    )}
                                <Link
                                    href={submissions(event.id)}
                                    className="underline-offset-4 hover:underline"
                                >
                                    {event.submissions_count} respuestas
                                </Link>
                                <span className="text-muted-foreground">
                                    · {event.raffles_count} sorteos
                                </span>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <p className="text-muted-foreground">
                            Aún no hay eventos.
                        </p>
                    )}
                </div>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Sorteos</h2>
                    <ul className="divide-y rounded-2xl border bg-card">
                        {raffles.map((raffle) => (
                            <li key={raffle.id}>
                                <Link
                                    href={showRaffle(raffle.id)}
                                    className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-accent"
                                >
                                    <span>
                                        <span className="block font-medium">
                                            {raffle.title}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            Premio: {raffle.prize}
                                        </span>
                                    </span>
                                    <span className="text-sm">
                                        {raffle.sold_count}/
                                        {raffle.total_tickets} pagados ·{' '}
                                        {money(
                                            raffle.sold_count *
                                                raffle.ticket_price,
                                        )}
                                    </span>
                                    <Badge
                                        variant={
                                            raffle.status === 'sorteado'
                                                ? 'default'
                                                : 'outline'
                                        }
                                    >
                                        {raffle.status === 'sorteado'
                                            ? 'Sorteado'
                                            : 'Abierto'}
                                    </Badge>
                                </Link>
                            </li>
                        ))}
                        {raffles.length === 0 && (
                            <li className="p-4 text-muted-foreground">
                                Aún no hay sorteos.
                            </li>
                        )}
                    </ul>

                    <form
                        className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.transform((values) => ({
                                ...values,
                                event_id:
                                    values.event_id === ''
                                        ? null
                                        : values.event_id,
                                draw_at: values.draw_at || null,
                            }));
                            form.submit(RaffleController.store());
                        }}
                    >
                        <h3 className="flex items-center gap-2 font-semibold sm:col-span-3">
                            <Ticket className="size-4" /> Nuevo sorteo
                        </h3>
                        <div className="grid gap-1">
                            <Label htmlFor="raffle_title">Título</Label>
                            <Input
                                id="raffle_title"
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                                placeholder="Sorteo Día de la Madre"
                            />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="prize">Premio</Label>
                            <Input
                                id="prize"
                                value={form.data.prize}
                                onChange={(e) =>
                                    form.setData('prize', e.target.value)
                                }
                                placeholder="Canasta de víveres"
                            />
                            <InputError message={form.errors.prize} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="raffle_event">Evento</Label>
                            <NativeSelect
                                id="raffle_event"
                                value={form.data.event_id}
                                placeholder="Sin evento"
                                options={events.map((e) => ({
                                    value: e.id,
                                    label: e.title,
                                }))}
                                onChange={(e) =>
                                    form.setData(
                                        'event_id',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : '',
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="ticket_price">
                                Precio del ticket (S/)
                            </Label>
                            <Input
                                id="ticket_price"
                                type="number"
                                min={0}
                                step="0.5"
                                value={form.data.ticket_price}
                                onChange={(e) =>
                                    form.setData('ticket_price', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="total_tickets">
                                Cantidad de tickets
                            </Label>
                            <Input
                                id="total_tickets"
                                type="number"
                                min={2}
                                max={2000}
                                value={form.data.total_tickets}
                                onChange={(e) =>
                                    form.setData(
                                        'total_tickets',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.total_tickets} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="draw_at">Fecha del sorteo</Label>
                            <Input
                                id="draw_at"
                                type="datetime-local"
                                value={form.data.draw_at}
                                onChange={(e) =>
                                    form.setData('draw_at', e.target.value)
                                }
                            />
                        </div>
                        <Button
                            type="submit"
                            className="sm:col-span-3 sm:w-fit"
                            disabled={form.processing}
                        >
                            Crear sorteo
                        </Button>
                    </form>
                </section>
            </div>
        </>
    );
}

EventsAdmin.layout = {
    breadcrumbs: [{ title: 'Eventos y sorteos', href: index() }],
};
