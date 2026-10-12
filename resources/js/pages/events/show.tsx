import { Head, Link, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Pencil,
    ShieldCheck,
    Ticket,
    Trophy,
} from 'lucide-react';
import EventController from '@/actions/App/Http/Controllers/EventController';
import { day, money } from '@/components/billing/format';
import InputError from '@/components/input-error';
import { textareaClass } from '@/components/school/block-editor';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit, submissions } from '@/routes/admin/events';
import { index, show } from '@/routes/events';
import type { EventTheme, FormField, MediaItem, RaffleSummary } from '@/types';

type Answer = string | number | boolean | null;
type Answers = Record<string, Answer>;

type Props = {
    event: {
        id: number;
        title: string;
        description: string | null;
        date: string;
        theme: EventTheme;
        banner: MediaItem | null;
        form_schema: Required<FormField>[];
        per_student: boolean;
        registration_open: boolean;
        published: boolean;
    };
    children: { id: number; name: string }[];
    mySubmissions: { student_id: number | null; data: Answers }[];
    raffles: (RaffleSummary & { my_tickets: number[] })[];
    canRespond: boolean;
    isAdmin: boolean;
};

export default function EventShow({
    event,
    children,
    mySubmissions,
    raffles,
    canRespond,
    isAdmin,
}: Props) {
    const firstStudent = children[0]?.id ?? null;
    const existing = (studentId: number | null) =>
        mySubmissions.find(
            (s) => s.student_id === (event.per_student ? studentId : null),
        );
    const form = useForm<{ student_id: number | null; data: Answers }>({
        student_id: firstStudent,
        data: existing(firstStudent)?.data ?? {},
    });
    const errors = form.errors as Record<string, string | undefined>;
    const answered = existing(form.data.student_id);
    const hasForm = event.form_schema.length > 0;

    return (
        <>
            <Head title={event.title} />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-16">
                <header
                    className="overflow-hidden rounded-3xl"
                    style={{ backgroundColor: event.theme.accent }}
                >
                    {event.banner && (
                        <img
                            src={event.banner.url}
                            alt=""
                            className="max-h-72 w-full object-cover"
                        />
                    )}
                    <div className="space-y-3 p-6 text-center sm:p-10">
                        {!event.banner && (
                            <div className="text-7xl" aria-hidden>
                                {event.theme.emoji}
                            </div>
                        )}
                        <h1
                            className="font-display text-3xl font-extrabold sm:text-4xl"
                            style={{ color: event.theme.color }}
                        >
                            {event.title}
                        </h1>
                        <p className="flex items-center justify-center gap-2 font-medium text-slate-700">
                            <CalendarDays className="size-4" />{' '}
                            {day(event.date)}
                        </p>
                        {event.description && (
                            <p className="mx-auto max-w-xl whitespace-pre-line text-slate-700">
                                {event.description}
                            </p>
                        )}
                        {isAdmin && (
                            <div className="flex flex-wrap justify-center gap-2 pt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white"
                                    asChild
                                >
                                    <Link href={edit(event.id)}>
                                        <Pencil /> Editar
                                    </Link>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white"
                                    asChild
                                >
                                    <Link href={submissions(event.id)}>
                                        Ver respuestas
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </header>

                {hasForm && canRespond && (
                    <form
                        className="space-y-4 rounded-2xl border bg-card p-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.submit(EventController.submit(event.id), {
                                preserveScroll: true,
                            });
                        }}
                    >
                        <h2
                            className="text-lg font-semibold"
                            style={{ color: event.theme.color }}
                        >
                            {answered
                                ? 'Tu respuesta (puedes actualizarla)'
                                : 'Inscríbete'}
                        </h2>
                        {event.per_student && children.length > 1 && (
                            <div className="grid gap-2">
                                <Label htmlFor="student_id">
                                    ¿Para qué hijo?
                                </Label>
                                <NativeSelect
                                    id="student_id"
                                    value={form.data.student_id ?? ''}
                                    options={children.map((c) => ({
                                        value: c.id,
                                        label: c.name,
                                    }))}
                                    onChange={(e) => {
                                        const id = Number(e.target.value);
                                        form.setData({
                                            student_id: id,
                                            data: existing(id)?.data ?? {},
                                        });
                                    }}
                                />
                            </div>
                        )}
                        {event.per_student && children.length === 1 && (
                            <p className="text-sm text-muted-foreground">
                                Para: {children[0].name}
                            </p>
                        )}
                        <InputError message={errors.student_id} />

                        {event.form_schema.map((field) => {
                            const value = form.data.data[field.key];
                            const set = (v: Answer) =>
                                form.setData('data', {
                                    ...form.data.data,
                                    [field.key]: v,
                                });
                            const id = `field-${field.key}`;

                            return (
                                <div key={field.key} className="grid gap-2">
                                    {field.type === 'checkbox' ? (
                                        <label className="flex items-center gap-3 text-sm">
                                            <Checkbox
                                                checked={value === true}
                                                onCheckedChange={(c) =>
                                                    set(c === true)
                                                }
                                            />
                                            {field.label}{' '}
                                            {field.required && '*'}
                                        </label>
                                    ) : (
                                        <>
                                            <Label htmlFor={id}>
                                                {field.label}{' '}
                                                {field.required && '*'}
                                            </Label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    id={id}
                                                    className={textareaClass}
                                                    value={String(value ?? '')}
                                                    onChange={(e) =>
                                                        set(e.target.value)
                                                    }
                                                />
                                            ) : field.type === 'select' ? (
                                                <NativeSelect
                                                    id={id}
                                                    value={String(value ?? '')}
                                                    placeholder="Elige una opción"
                                                    options={field.options.map(
                                                        (o) => ({
                                                            value: o,
                                                            label: o,
                                                        }),
                                                    )}
                                                    onChange={(e) =>
                                                        set(e.target.value)
                                                    }
                                                />
                                            ) : (
                                                <Input
                                                    id={id}
                                                    type={
                                                        field.type === 'number'
                                                            ? 'number'
                                                            : 'text'
                                                    }
                                                    value={String(value ?? '')}
                                                    onChange={(e) =>
                                                        set(e.target.value)
                                                    }
                                                />
                                            )}
                                        </>
                                    )}
                                    <InputError
                                        message={errors[`data.${field.key}`]}
                                    />
                                </div>
                            );
                        })}
                        <Button
                            type="submit"
                            disabled={form.processing}
                            style={{ backgroundColor: event.theme.color }}
                        >
                            {answered ? 'Actualizar respuesta' : 'Enviar'}
                        </Button>
                        {answered && (
                            <p className="flex items-center gap-2 text-sm text-green-700">
                                <CheckCircle2 className="size-4" /> Ya recibimos
                                tu respuesta.
                            </p>
                        )}
                    </form>
                )}
                {hasForm && !event.registration_open && (
                    <p className="rounded-2xl bg-muted p-4 text-center text-sm">
                        Las inscripciones para este evento están cerradas.
                    </p>
                )}

                {raffles.map((raffle) => (
                    <section
                        key={raffle.id}
                        className="space-y-3 rounded-2xl border bg-card p-5"
                    >
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <Ticket
                                className="size-5"
                                style={{ color: event.theme.color }}
                            />{' '}
                            {raffle.title}
                        </h2>
                        <p>
                            🎁 Premio: <strong>{raffle.prize}</strong> · Ticket
                            a {money(raffle.ticket_price)}
                            {raffle.draw_at &&
                                ` · Sorteo: ${day(raffle.draw_at)}`}
                        </p>
                        {raffle.my_tickets.length > 0 && (
                            <p className="text-sm">
                                Tus tickets:{' '}
                                <strong>
                                    {raffle.my_tickets
                                        .map((n) => `N° ${n}`)
                                        .join(', ')}
                                </strong>
                            </p>
                        )}
                        {raffle.my_tickets.length === 0 &&
                            raffle.status === 'abierto' && (
                                <p className="text-sm text-muted-foreground">
                                    Pide tus tickets en la administración del
                                    colegio.
                                </p>
                            )}
                        {raffle.winner && (
                            <div
                                className="space-y-2 rounded-xl p-4"
                                style={{ backgroundColor: event.theme.accent }}
                            >
                                <p
                                    className="flex items-center gap-2 text-lg font-bold"
                                    style={{ color: event.theme.color }}
                                >
                                    <Trophy className="size-5" /> Ganador:
                                    ticket N° {raffle.winner.number}
                                    {raffle.winner.name &&
                                        ` — ${raffle.winner.name}`}
                                </p>
                                {raffle.my_tickets.includes(
                                    raffle.winner.number,
                                ) && (
                                    <p className="font-semibold">
                                        🎉 ¡Felicidades, ganaste!
                                    </p>
                                )}
                                <p className="flex items-start gap-2 text-xs text-slate-600">
                                    <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                                    <span>
                                        Sorteo verificable: semilla{' '}
                                        <code className="break-all">
                                            {raffle.seed}
                                        </code>
                                        . Ganador = SHA-256 de la semilla
                                        (primeros 13 caracteres) módulo la
                                        cantidad de tickets pagados, ordenados
                                        por número.
                                    </span>
                                </p>
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </>
    );
}

EventShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Eventos', href: index() },
        { title: props.event.title, href: show(props.event.id) },
    ],
});
