import { Form, Head, router } from '@inertiajs/react';
import { ExternalLink, Phone, Trash2 } from 'lucide-react';
import VisitController from '@/actions/App/Http/Controllers/Admin/VisitController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localToday } from '@/lib/school';
import { visit } from '@/routes';
import { index } from '@/routes/admin/visits';
import type { Option } from '@/types';

type Booking = {
    id: number;
    parent_name: string;
    phone: string;
    email: string | null;
    child_name: string | null;
    notes: string | null;
    status: string;
};
type Slot = {
    id: number;
    starts_at: string;
    capacity: number;
    bookings: Booking[];
};

const dayLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
});
const timeLabel = new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
});
const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Visits({
    slots,
    statuses,
}: {
    slots: Slot[];
    statuses: Option[];
}) {
    const withBookings = slots.filter((slot) => slot.bookings.length > 0);
    const free = slots.filter((slot) => slot.bookings.length === 0);

    return (
        <>
            <Head title="Visitas guiadas" />
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Visitas guiadas"
                        description="Horarios que las familias pueden reservar desde el sitio web."
                    />
                    <Button variant="outline" asChild>
                        <a href={visit().url} target="_blank" rel="noreferrer">
                            <ExternalLink /> Ver página de reservas
                        </a>
                    </Button>
                </div>

                <Form
                    {...VisitController.storeSlots.form()}
                    options={{ preserveScroll: true }}
                    className="grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2"
                >
                    {({ errors, processing }) => (
                        <>
                            <h2 className="font-semibold sm:col-span-2">
                                Abrir horarios
                            </h2>
                            <div className="grid gap-1.5">
                                <Label htmlFor="from">Desde</Label>
                                <Input
                                    id="from"
                                    name="from"
                                    type="date"
                                    defaultValue={localToday()}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="to">Hasta</Label>
                                <Input id="to" name="to" type="date" />
                                <InputError message={errors.to} />
                            </div>
                            <fieldset className="space-y-1.5 sm:col-span-2">
                                <legend className="text-sm font-medium">
                                    Días
                                </legend>
                                <div className="flex flex-wrap gap-3">
                                    {weekdays.map((label, i) => (
                                        <label
                                            key={label}
                                            className="flex items-center gap-1.5 text-sm"
                                        >
                                            <Checkbox
                                                name="weekdays[]"
                                                value={String(i + 1)}
                                                defaultChecked={i < 5}
                                            />{' '}
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.weekdays} />
                            </fieldset>
                            <div className="grid gap-1.5">
                                <Label>Horas</Label>
                                <div className="flex gap-2">
                                    <Input
                                        name="times[]"
                                        type="time"
                                        defaultValue="10:00"
                                        aria-label="Primera hora"
                                    />
                                    <Input
                                        name="times[]"
                                        type="time"
                                        defaultValue="15:00"
                                        aria-label="Segunda hora"
                                    />
                                </div>
                                <InputError
                                    message={errors.times ?? errors['times.0']}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="capacity">
                                    Familias por horario
                                </Label>
                                <Input
                                    id="capacity"
                                    name="capacity"
                                    type="number"
                                    min={1}
                                    max={20}
                                    defaultValue={3}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="sm:col-span-2 sm:w-fit"
                            >
                                Crear horarios
                            </Button>
                        </>
                    )}
                </Form>

                <section className="space-y-3">
                    <h2 className="font-semibold">Visitas reservadas</h2>
                    {withBookings.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Aún no hay reservas.
                        </p>
                    )}
                    {withBookings.map((slot) => (
                        <div
                            key={slot.id}
                            className="space-y-2 rounded-2xl border bg-card p-4"
                        >
                            <p className="font-medium first-letter:uppercase">
                                {dayLabel.format(new Date(slot.starts_at))} ·{' '}
                                {timeLabel.format(new Date(slot.starts_at))}
                                <span className="text-sm font-normal text-muted-foreground">
                                    {' '}
                                    ·{' '}
                                    {
                                        slot.bookings.filter(
                                            (b) => b.status !== 'cancelada',
                                        ).length
                                    }
                                    /{slot.capacity}
                                </span>
                            </p>
                            <ul className="divide-y text-sm">
                                {slot.bookings.map((booking) => (
                                    <li
                                        key={booking.id}
                                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                                    >
                                        <span>
                                            <span className="font-medium">
                                                {booking.parent_name}
                                            </span>
                                            {booking.child_name &&
                                                ` · ${booking.child_name}`}
                                            <a
                                                href={`tel:${booking.phone}`}
                                                className="ml-2 inline-flex items-center gap-1 text-muted-foreground hover:underline"
                                            >
                                                <Phone className="size-3" />{' '}
                                                {booking.phone}
                                            </a>
                                        </span>
                                        <NativeSelect
                                            className="w-40"
                                            aria-label="Estado"
                                            value={booking.status}
                                            options={statuses}
                                            onChange={(e) =>
                                                router.put(
                                                    VisitController.updateBooking.url(
                                                        booking.id,
                                                    ),
                                                    { status: e.target.value },
                                                    { preserveScroll: true },
                                                )
                                            }
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>

                {free.length > 0 && (
                    <section className="space-y-2">
                        <h2 className="font-semibold">
                            Horarios libres ({free.length})
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {free.map((slot) => (
                                <span
                                    key={slot.id}
                                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs first-letter:uppercase"
                                >
                                    {dayLabel.format(new Date(slot.starts_at))}{' '}
                                    {timeLabel.format(new Date(slot.starts_at))}
                                    <button
                                        type="button"
                                        aria-label="Quitar horario"
                                        onClick={() =>
                                            router.delete(
                                                VisitController.destroySlot.url(
                                                    slot.id,
                                                ),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 className="size-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

Visits.layout = { breadcrumbs: [{ title: 'Visitas guiadas', href: index() }] };
