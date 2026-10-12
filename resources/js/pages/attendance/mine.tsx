import { Head, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { mine } from '@/routes/attendance';

type AttendanceRecord = {
    date: string;
    status: 'presente' | 'tardanza' | 'falta' | 'justificada';
    arrived_at: string | null;
    left_at: string | null;
    picked_up_by: string | null;
    notes: string | null;
};

type Props = {
    month: string;
    children: { id: number; name: string; records: AttendanceRecord[] }[];
};

const tones: Record<AttendanceRecord['status'], string> = {
    presente: 'bg-green-100 text-green-900 border-green-200',
    tardanza: 'bg-amber-100 text-amber-900 border-amber-200',
    falta: 'bg-red-100 text-red-900 border-red-200',
    justificada: 'bg-sky-100 text-sky-900 border-sky-200',
};

const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function MyChildrenAttendance({ month, children }: Props) {
    const [year, monthNumber] = month.split('-').map(Number);
    const first = new Date(year, monthNumber - 1, 1);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const offset = (first.getDay() + 6) % 7;

    return (
        <>
            <Head title="Asistencia" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Asistencia de mis hijos"
                        description="Toca un día para ver la hora de llegada y quién lo recogió."
                    />
                    <Input
                        type="month"
                        className="w-44"
                        value={month}
                        onChange={(e) =>
                            router.get(mine.url(), { mes: e.target.value })
                        }
                    />
                </div>

                {children.map((child) => {
                    const byDay = Object.fromEntries(
                        child.records.map((r) => [Number(r.date.slice(8)), r]),
                    );
                    const counts = child.records.reduce<Record<string, number>>(
                        (acc, r) => ({
                            ...acc,
                            [r.status]: (acc[r.status] ?? 0) + 1,
                        }),
                        {},
                    );

                    return (
                        <section
                            key={child.id}
                            className="space-y-3 rounded-2xl border bg-card p-5"
                        >
                            <h2 className="text-lg font-semibold">
                                {child.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {counts.presente ?? 0} asistencias ·{' '}
                                {counts.tardanza ?? 0} tardanzas ·{' '}
                                {counts.falta ?? 0} faltas ·{' '}
                                {counts.justificada ?? 0} justificadas
                            </p>
                            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                {weekdays.map((d, i) => (
                                    <span
                                        key={i}
                                        className="text-xs font-medium text-muted-foreground"
                                    >
                                        {d}
                                    </span>
                                ))}
                                {Array.from({ length: offset }).map((_, i) => (
                                    <span key={`empty-${i}`} />
                                ))}
                                {Array.from(
                                    { length: daysInMonth },
                                    (_, i) => i + 1,
                                ).map((dayNumber) => {
                                    const record = byDay[dayNumber];

                                    return (
                                        <details
                                            key={dayNumber}
                                            className="group relative"
                                        >
                                            <summary
                                                className={cn(
                                                    'flex aspect-square cursor-pointer list-none items-center justify-center rounded-lg border',
                                                    record
                                                        ? tones[record.status]
                                                        : 'border-transparent text-muted-foreground',
                                                )}
                                            >
                                                {dayNumber}
                                            </summary>
                                            {record && (
                                                <div className="absolute top-full left-1/2 z-10 mt-1 w-48 -translate-x-1/2 rounded-lg border bg-popover p-2 text-left text-xs shadow-md">
                                                    <p className="font-semibold capitalize">
                                                        {record.status}
                                                    </p>
                                                    {record.arrived_at && (
                                                        <p>
                                                            Llegó:{' '}
                                                            {record.arrived_at}
                                                        </p>
                                                    )}
                                                    {record.left_at && (
                                                        <p>
                                                            Salió:{' '}
                                                            {record.left_at}
                                                        </p>
                                                    )}
                                                    {record.picked_up_by && (
                                                        <p>
                                                            Lo recogió:{' '}
                                                            {
                                                                record.picked_up_by
                                                            }
                                                        </p>
                                                    )}
                                                    {record.notes && (
                                                        <p className="text-muted-foreground">
                                                            {record.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </details>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        </>
    );
}

MyChildrenAttendance.layout = {
    breadcrumbs: [{ title: 'Asistencia', href: mine() }],
};
