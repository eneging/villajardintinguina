import { Head, useForm } from '@inertiajs/react';
import { Clock, LogIn, LogOut, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import StaffAttendanceController from '@/actions/App/Http/Controllers/StaffAttendanceController';
import { day } from '@/components/billing/format';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { staff } from '@/routes/attendance';

type StaffRecord = {
    date: string;
    status: 'puntual' | 'tardanza' | 'falta' | 'justificada';
    check_in_at: string | null;
    check_out_at: string | null;
    late_minutes: number;
    notes: string | null;
};

type Props = {
    today: StaffRecord | null;
    history: StaffRecord[];
    startTime: string;
    toleranceMinutes: number;
    requiresLocation: boolean;
};

const statusText = {
    puntual: '🟢 Puntual',
    tardanza: '🟠 Tardanza',
    falta: '🔴 Falta',
    justificada: '🔵 Justificada',
} as const;

export default function StaffAttendance({
    today,
    history,
    startTime,
    toleranceMinutes,
    requiresLocation,
}: Props) {
    const [clock, setClock] = useState(() => new Date());
    const [locating, setLocating] = useState(false);
    const form = useForm({
        latitude: null as number | null,
        longitude: null as number | null,
    });
    const errors = form.errors as Record<string, string | undefined>;

    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000);

        return () => clearInterval(timer);
    }, []);

    function mark(kind: 'in' | 'out') {
        const action =
            kind === 'in'
                ? StaffAttendanceController.checkIn()
                : StaffAttendanceController.checkOut();
        const send = (latitude: number | null, longitude: number | null) => {
            form.transform(() => ({ latitude, longitude }));
            form.submit(action, {
                preserveScroll: true,
                onFinish: () => setLocating(false),
            });
        };

        if (!requiresLocation || !navigator.geolocation) {
            send(null, null);

            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) =>
                send(position.coords.latitude, position.coords.longitude),
            () => send(null, null),
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }

    return (
        <>
            <Head title="Mi asistencia" />
            <div className="mx-auto w-full max-w-xl space-y-6 p-4">
                <Heading
                    title="Mi asistencia"
                    description={`Ingreso ${startTime} (tolerancia ${toleranceMinutes} min). Se usa la hora del servidor.`}
                />

                <section className="space-y-4 rounded-3xl border bg-card p-6 text-center">
                    <p className="flex items-center justify-center gap-2 text-4xl font-bold tabular-nums">
                        <Clock className="size-8 text-muted-foreground" />
                        {clock.toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })}
                    </p>
                    {today && (
                        <p className="text-sm">
                            {statusText[today.status]}
                            {today.check_in_at &&
                                ` · Entrada ${today.check_in_at}`}
                            {today.late_minutes > 0 &&
                                ` (${today.late_minutes} min tarde)`}
                            {today.check_out_at &&
                                ` · Salida ${today.check_out_at}`}
                        </p>
                    )}
                    {!today?.check_in_at ? (
                        <Button
                            size="lg"
                            className="h-16 w-full text-lg"
                            disabled={form.processing || locating}
                            onClick={() => mark('in')}
                        >
                            <LogIn className="size-6" /> Marcar entrada
                        </Button>
                    ) : !today.check_out_at ? (
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-16 w-full text-lg"
                            disabled={form.processing || locating}
                            onClick={() => mark('out')}
                        >
                            <LogOut className="size-6" /> Marcar salida
                        </Button>
                    ) : (
                        <p className="rounded-xl bg-green-50 p-3 text-green-900">
                            Jornada completa registrada ✓
                        </p>
                    )}
                    {requiresLocation && (
                        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />{' '}
                            {locating
                                ? 'Obteniendo ubicación…'
                                : 'Se verifica que estés en el colegio.'}
                        </p>
                    )}
                    <InputError message={errors.attendance} />
                </section>

                <section className="space-y-2">
                    <h2 className="font-semibold">Este mes</h2>
                    <ul className="divide-y rounded-2xl border bg-card text-sm">
                        {history.map((record) => (
                            <li
                                key={record.date}
                                className="flex flex-wrap justify-between gap-2 p-3"
                            >
                                <span>{day(record.date)}</span>
                                <span className="text-muted-foreground">
                                    {record.check_in_at ?? '—'} →{' '}
                                    {record.check_out_at ?? '—'}
                                </span>
                                <span>{statusText[record.status]}</span>
                            </li>
                        ))}
                        {history.length === 0 && (
                            <li className="p-3 text-muted-foreground">
                                Sin registros este mes.
                            </li>
                        )}
                    </ul>
                </section>
            </div>
        </>
    );
}

StaffAttendance.layout = {
    breadcrumbs: [{ title: 'Mi asistencia', href: staff() }],
};
