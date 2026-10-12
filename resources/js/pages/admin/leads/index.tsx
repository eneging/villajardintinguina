import { Form, Head, router } from '@inertiajs/react';
import { MessageCircle, Phone, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import LeadController from '@/actions/App/Http/Controllers/Admin/LeadController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Pagination } from '@/components/school/pagination';
import type { Paginated } from '@/components/school/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { index } from '@/routes/admin/leads';
import type { Option } from '@/types';

type LeadRow = {
    id: number;
    parent_name: string;
    phone: string;
    whatsapp: string | null;
    email: string | null;
    child_name: string | null;
    child_age: string | null;
    level_interest: string | null;
    message: string | null;
    status: string;
    source: string;
    notes: string | null;
    created_at: string;
    contacted_at: string | null;
};

type Props = {
    leads: Paginated<LeadRow>;
    counts: Record<string, number>;
    statuses: Option[];
    sources: Option[];
    filters: { status: string; search: string };
};

const statusStyles: Record<string, string> = {
    nuevo: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    contactado:
        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    visita: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
    matriculado:
        'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    descartado: 'bg-muted text-muted-foreground',
};

const dateTime = new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
});

function LeadCard({ lead, statuses }: { lead: LeadRow; statuses: Option[] }) {
    const [status, setStatus] = useState(lead.status);
    const [notes, setNotes] = useState(lead.notes ?? '');
    const dirty = status !== lead.status || notes !== (lead.notes ?? '');
    const greeting = `Hola ${lead.parent_name.split(' ')[0]}, le saluda la dirección de EP Villa Jardín. Recibimos su solicitud de información${lead.child_name ? ` para ${lead.child_name}` : ''}. ¿Le gustaría agendar una visita?`;

    return (
        <article className="space-y-3 rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h2 className="font-semibold">{lead.parent_name}</h2>
                    <p className="text-sm text-muted-foreground">
                        {dateTime.format(new Date(lead.created_at))} ·{' '}
                        {lead.source === 'web' ? 'Sitio web' : lead.source}
                    </p>
                </div>
                <span
                    className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusStyles[lead.status],
                    )}
                >
                    {statuses.find((s) => s.value === lead.status)?.label}
                </span>
            </div>
            <dl className="grid gap-1 text-sm sm:grid-cols-2">
                {lead.child_name && (
                    <div>
                        <dt className="inline text-muted-foreground">
                            Niño(a):{' '}
                        </dt>
                        <dd className="inline">
                            {lead.child_name}
                            {lead.child_age && ` (${lead.child_age})`}
                        </dd>
                    </div>
                )}
                {lead.level_interest && (
                    <div>
                        <dt className="inline text-muted-foreground">
                            Nivel:{' '}
                        </dt>
                        <dd className="inline">{lead.level_interest}</dd>
                    </div>
                )}
                {lead.email && (
                    <div>
                        <dt className="inline text-muted-foreground">
                            Correo:{' '}
                        </dt>
                        <dd className="inline">{lead.email}</dd>
                    </div>
                )}
            </dl>
            {lead.message && (
                <p className="rounded-xl bg-muted/50 p-3 text-sm whitespace-pre-line">
                    {lead.message}
                </p>
            )}
            <div className="flex flex-wrap gap-2">
                {lead.whatsapp && (
                    <Button
                        size="sm"
                        asChild
                        className="bg-[#25d366] hover:bg-[#1fb457]"
                    >
                        <a
                            href={`https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(greeting)}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <MessageCircle /> WhatsApp
                        </a>
                    </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${lead.phone.replace(/\s/g, '')}`}>
                        <Phone /> {lead.phone}
                    </a>
                </Button>
            </div>
            <div className="grid gap-2 border-t pt-3 sm:grid-cols-[12rem_1fr_auto]">
                <NativeSelect
                    aria-label="Estado"
                    value={status}
                    options={statuses}
                    onChange={(e) => setStatus(e.target.value)}
                />
                <Input
                    aria-label="Notas de seguimiento"
                    placeholder="Notas: visita el jueves 10 a. m.…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        disabled={!dirty}
                        onClick={() =>
                            router.put(
                                LeadController.update.url(lead.id),
                                { status, notes },
                                { preserveScroll: true },
                            )
                        }
                    >
                        Guardar
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        aria-label="Eliminar"
                        onClick={() => {
                            if (confirm('¿Eliminar esta solicitud?')) {
                                router.delete(
                                    LeadController.destroy.url(lead.id),
                                    { preserveScroll: true },
                                );
                            }
                        }}
                    >
                        <Trash2 />
                    </Button>
                </div>
            </div>
        </article>
    );
}

export default function LeadsIndex({
    leads,
    counts,
    statuses,
    sources,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);

    function apply(next: Partial<Props['filters']>) {
        router.get(
            index.url(),
            { ...filters, search, ...next },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Admisiones" />
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Admisiones"
                        description="Familias interesadas que dejaron sus datos en el sitio web o que registraste tú."
                    />
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus /> Registrar familia
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Registrar familia interesada
                                </DialogTitle>
                            </DialogHeader>
                            <Form
                                {...LeadController.store.form()}
                                options={{ preserveScroll: true }}
                                onSuccess={() => setOpen(false)}
                                resetOnSuccess
                                className="grid gap-3"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="lead-name">
                                                Nombre
                                            </Label>
                                            <Input
                                                id="lead-name"
                                                name="parent_name"
                                            />
                                            <InputError
                                                message={errors.parent_name}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="lead-phone">
                                                Celular
                                            </Label>
                                            <Input
                                                id="lead-phone"
                                                name="phone"
                                            />
                                            <InputError
                                                message={errors.phone}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="lead-child">
                                                Niño(a)
                                            </Label>
                                            <Input
                                                id="lead-child"
                                                name="child_name"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="lead-level">
                                                Nivel de interés
                                            </Label>
                                            <Input
                                                id="lead-level"
                                                name="level_interest"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="lead-source">
                                                ¿Cómo nos contactó?
                                            </Label>
                                            <NativeSelect
                                                id="lead-source"
                                                name="source"
                                                defaultValue="whatsapp"
                                                options={sources}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="lead-message">
                                                Notas
                                            </Label>
                                            <Input
                                                id="lead-message"
                                                name="message"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Guardar
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        variant={filters.status === '' ? 'default' : 'outline'}
                        onClick={() => apply({ status: '' })}
                    >
                        Todas
                    </Button>
                    {statuses.map((status) => (
                        <Button
                            key={status.value}
                            size="sm"
                            variant={
                                filters.status === status.value
                                    ? 'default'
                                    : 'outline'
                            }
                            onClick={() => apply({ status: status.value })}
                        >
                            {status.label}
                            <Badge variant="secondary" className="ml-1">
                                {counts[status.value] ?? 0}
                            </Badge>
                        </Button>
                    ))}
                </div>

                <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        apply({});
                    }}
                >
                    <Input
                        className="max-w-xs"
                        placeholder="Buscar por nombre o celular"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button type="submit" variant="outline">
                        <Search /> Buscar
                    </Button>
                </form>

                <div className="grid gap-3">
                    {leads.data.map((lead) => (
                        <LeadCard
                            key={`${lead.id}-${lead.status}-${lead.notes}`}
                            lead={lead}
                            statuses={statuses}
                        />
                    ))}
                    {leads.data.length === 0 && (
                        <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
                            No hay solicitudes con este filtro.
                        </p>
                    )}
                </div>
                <Pagination page={leads} />
            </div>
        </>
    );
}

LeadsIndex.layout = {
    breadcrumbs: [{ title: 'Admisiones', href: index() }],
};
