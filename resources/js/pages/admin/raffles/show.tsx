import { Form, Head, Link, router } from '@inertiajs/react';
import { PartyPopper, Pencil, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import RaffleController from '@/actions/App/Http/Controllers/Admin/RaffleController';
import { money } from '@/components/billing/format';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { index as events } from '@/routes/admin/events';
import { live, show } from '@/routes/admin/raffles';

type TicketRow = {
    id: number;
    number: number;
    buyer_id: number | null;
    holder: string | null;
    paid: boolean;
};

type Props = {
    raffle: {
        id: number;
        title: string;
        prize: string;
        ticket_price: number;
        total_tickets: number;
        status: 'abierto' | 'sorteado';
        draw_at: string | null;
        winner: { number: number; name: string | null } | null;
    };
    tickets: TicketRow[];
    parents: { value: number; label: string }[];
};

export default function RaffleShow({ raffle, tickets, parents }: Props) {
    const [selected, setSelected] = useState<TicketRow | null>(null);
    const [query, setQuery] = useState('');
    const [draft, setDraft] = useState({
        buyer_id: '' as number | '',
        buyer_name: '',
        paid: true,
    });
    const paid = tickets.filter((t) => t.paid).length;
    const reserved = tickets.filter((t) => t.holder && !t.paid).length;
    const visible = useMemo(
        () =>
            tickets.filter(
                (t) =>
                    !query ||
                    String(t.number) === query.trim() ||
                    t.holder?.toLowerCase().includes(query.toLowerCase()),
            ),
        [tickets, query],
    );
    const open = raffle.status === 'abierto';

    function pick(ticket: TicketRow) {
        if (!open) {
            return;
        }
        setSelected(ticket);
        setDraft({
            buyer_id: ticket.buyer_id ?? '',
            buyer_name: ticket.buyer_id ? '' : (ticket.holder ?? ''),
            paid: ticket.holder ? ticket.paid : true,
        });
    }

    function save() {
        if (!selected) {
            return;
        }
        router.put(
            RaffleController.assign.url(selected.id),
            {
                buyer_id: draft.buyer_id === '' ? null : draft.buyer_id,
                buyer_name: draft.buyer_name || null,
                paid: draft.paid,
            },
            { preserveScroll: true, onSuccess: () => setSelected(null) },
        );
    }

    return (
        <>
            <Head title={raffle.title} />
            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title={raffle.title}
                        description={`Premio: ${raffle.prize} · Ticket ${money(raffle.ticket_price)} · ${paid} pagados (${money(paid * raffle.ticket_price)}) · ${reserved} separados sin pagar`}
                    />
                    {open ? (
                        <Button
                            size="lg"
                            disabled={paid === 0}
                            onClick={() =>
                                confirm(
                                    `Se sorteará entre ${paid} tickets pagados. Ya no se podrán vender más. ¿Sortear ahora?`,
                                ) &&
                                router.post(
                                    RaffleController.draw.url(raffle.id),
                                )
                            }
                        >
                            <PartyPopper /> Sortear en vivo
                        </Button>
                    ) : (
                        <Button size="lg" asChild>
                            <Link href={live(raffle.id)}>
                                <PartyPopper /> Ver resultado (N°{' '}
                                {raffle.winner?.number})
                            </Link>
                        </Button>
                    )}
                </div>

                {open && (
                    <details className="rounded-2xl border bg-card p-4">
                        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                            <Pencil className="size-4" /> Editar datos del
                            sorteo
                        </summary>
                        <Form
                            {...RaffleController.update.form(raffle.id)}
                            options={{ preserveScroll: true }}
                            className="mt-4 grid gap-3 sm:grid-cols-2"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-1">
                                        <Label htmlFor="raffle-title">
                                            Título
                                        </Label>
                                        <Input
                                            id="raffle-title"
                                            name="title"
                                            defaultValue={raffle.title}
                                        />
                                        <InputError message={errors.title} />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="raffle-prize">
                                            Premio
                                        </Label>
                                        <Input
                                            id="raffle-prize"
                                            name="prize"
                                            defaultValue={raffle.prize}
                                        />
                                        <InputError message={errors.prize} />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="raffle-price">
                                            Precio del ticket (S/)
                                        </Label>
                                        <Input
                                            id="raffle-price"
                                            name="ticket_price"
                                            type="number"
                                            step="0.5"
                                            min={0}
                                            defaultValue={raffle.ticket_price}
                                        />
                                        <InputError
                                            message={errors.ticket_price}
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="raffle-draw">
                                            Fecha del sorteo
                                        </Label>
                                        <Input
                                            id="raffle-draw"
                                            name="draw_at"
                                            type="datetime-local"
                                            defaultValue={
                                                raffle.draw_at?.slice(0, 16) ??
                                                ''
                                            }
                                        />
                                    </div>
                                    <InputError
                                        message={errors.raffle}
                                        className="sm:col-span-2"
                                    />
                                    <div className="flex flex-wrap justify-between gap-2 sm:col-span-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="text-destructive"
                                            disabled={paid > 0}
                                            title={
                                                paid > 0
                                                    ? 'Ya hay tickets pagados'
                                                    : undefined
                                            }
                                            onClick={() =>
                                                confirm(
                                                    '¿Eliminar este sorteo y todos sus tickets?',
                                                ) &&
                                                router.delete(
                                                    RaffleController.destroy.url(
                                                        raffle.id,
                                                    ),
                                                )
                                            }
                                        >
                                            <Trash2 /> Eliminar sorteo
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Guardar cambios
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </details>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-2">
                        <span className="size-4 rounded border bg-background" />{' '}
                        Libre
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="size-4 rounded border border-amber-400 bg-amber-100" />{' '}
                        Separado (sin pagar)
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="size-4 rounded bg-green-600" /> Pagado
                    </span>
                    <label className="ml-auto flex items-center gap-2">
                        <Search className="size-4" />
                        <Input
                            className="w-56"
                            placeholder="Buscar número o nombre"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </label>
                </div>

                {selected && (
                    <div className="grid gap-3 rounded-2xl border-2 border-primary bg-card p-4 sm:grid-cols-[auto_1fr_1fr_auto_auto] sm:items-center">
                        <span className="text-lg font-bold">
                            N° {selected.number}
                        </span>
                        <NativeSelect
                            value={draft.buyer_id}
                            placeholder="Familia registrada…"
                            options={parents}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    buyer_id: e.target.value
                                        ? Number(e.target.value)
                                        : '',
                                    buyer_name: '',
                                })
                            }
                        />
                        <Input
                            placeholder="…u otro nombre"
                            value={draft.buyer_name}
                            disabled={draft.buyer_id !== ''}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    buyer_name: e.target.value,
                                })
                            }
                        />
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={draft.paid}
                                onCheckedChange={(c) =>
                                    setDraft({ ...draft, paid: c === true })
                                }
                            />{' '}
                            Pagado
                        </label>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={save}>
                                Guardar
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelected(null)}
                            >
                                Cancelar
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground sm:col-span-5">
                            Para liberar el ticket, deja la familia y el nombre
                            vacíos.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {visible.map((ticket) => (
                        <button
                            key={ticket.id}
                            type="button"
                            onClick={() => pick(ticket)}
                            title={ticket.holder ?? 'Libre'}
                            className={cn(
                                'flex aspect-square flex-col items-center justify-center rounded-lg border text-sm font-semibold transition',
                                ticket.paid
                                    ? 'border-green-700 bg-green-600 text-white'
                                    : ticket.holder
                                      ? 'border-amber-400 bg-amber-100 text-amber-900'
                                      : 'bg-background hover:bg-accent',
                                raffle.winner?.number === ticket.number &&
                                    'ring-4 ring-yellow-400',
                                selected?.id === ticket.id &&
                                    'ring-2 ring-primary',
                            )}
                        >
                            {ticket.number}
                            {ticket.holder && (
                                <span className="w-full truncate px-1 text-[10px] font-normal">
                                    {ticket.holder.split(' ')[0]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

RaffleShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Eventos y sorteos', href: events() },
        { title: props.raffle.title, href: show(props.raffle.id) },
    ],
});
