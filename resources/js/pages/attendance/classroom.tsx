import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    CheckCheck,
    FileBarChart,
} from 'lucide-react';
import { useMemo } from 'react';
import StudentAttendanceController from '@/actions/App/Http/Controllers/StudentAttendanceController';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { classroom as classroomRoute, report } from '@/routes/attendance';
import { show } from '@/routes/classrooms';
import { show as showStudent } from '@/routes/students';

type Status = 'presente' | 'tardanza' | 'falta' | 'justificada';

type StudentRow = {
    enrollment_id: number;
    student_id: number;
    name: string;
    allergies: string | null;
    photo: string | null;
    pickups: string[];
    record: {
        status: Status;
        arrived_at: string | null;
        left_at: string | null;
        picked_up_by: string | null;
        notes: string | null;
    } | null;
};

type Props = {
    classroom: {
        id: number;
        name: string;
        level: string;
        color: string;
        mascot: string | null;
    };
    date: string;
    isBusinessDay: boolean;
    startTime: string;
    students: StudentRow[];
};

type Entry = {
    enrollment_id: number;
    status: Status | '';
    arrived_at: string;
    left_at: string;
    picked_up_by: string;
    notes: string;
};

const statuses: { value: Status; label: string; className: string }[] = [
    {
        value: 'presente',
        label: 'Presente',
        className: 'bg-green-600 text-white border-green-600',
    },
    {
        value: 'tardanza',
        label: 'Tardanza',
        className: 'bg-amber-500 text-white border-amber-500',
    },
    {
        value: 'falta',
        label: 'Falta',
        className: 'bg-red-600 text-white border-red-600',
    },
    {
        value: 'justificada',
        label: 'Justificada',
        className: 'bg-sky-600 text-white border-sky-600',
    },
];

function nowTime(): string {
    const now = new Date();

    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function ClassroomAttendance({
    classroom,
    date,
    isBusinessDay,
    startTime,
    students,
}: Props) {
    const form = useForm<{ date: string; entries: Entry[] }>({
        date,
        entries: students.map((student) => ({
            enrollment_id: student.enrollment_id,
            status: student.record?.status ?? '',
            arrived_at: student.record?.arrived_at ?? '',
            left_at: student.record?.left_at ?? '',
            picked_up_by: student.record?.picked_up_by ?? '',
            notes: student.record?.notes ?? '',
        })),
    });
    const { data, setData, processing, errors } = form;
    const isToday =
        date === new Date().toISOString().slice(0, 10) ||
        date === new Date().toLocaleDateString('en-CA');

    const counts = useMemo(
        () =>
            Object.fromEntries(
                statuses.map((s) => [
                    s.value,
                    data.entries.filter((e) => e.status === s.value).length,
                ]),
            ),
        [data.entries],
    );
    const missing = data.entries.filter((e) => e.status === '').length;

    function update(index: number, patch: Partial<Entry>) {
        setData(
            'entries',
            data.entries.map((entry, i) =>
                i === index ? { ...entry, ...patch } : entry,
            ),
        );
    }

    function setStatus(index: number, status: Status) {
        const entry = data.entries[index];
        const arrives = status === 'presente' || status === 'tardanza';
        const time = entry.arrived_at || (arrives && isToday ? nowTime() : '');
        update(index, {
            status:
                arrives && time > startTime && status === 'presente' && isToday
                    ? 'tardanza'
                    : status,
            arrived_at: arrives ? time : '',
        });
    }

    return (
        <>
            <Head title={`Asistencia · ${classroom.name}`} />
            <form
                className="mx-auto w-full max-w-3xl space-y-4 p-4 pb-28"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((values) => ({
                        ...values,
                        entries: values.entries.filter((e) => e.status !== ''),
                    }));
                    form.submit(
                        StudentAttendanceController.store(classroom.id),
                        { preserveScroll: true },
                    );
                }}
            >
                <header
                    className="flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5"
                    style={{ backgroundColor: `${classroom.color}26` }}
                >
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {classroom.level}
                        </p>
                        <h1 className="text-2xl font-bold">
                            {classroom.mascot} Asistencia · {classroom.name}
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                            <CalendarDays className="size-4" />
                            <Input
                                type="date"
                                className="w-40 bg-white"
                                value={date}
                                max={new Date().toLocaleDateString('en-CA')}
                                onChange={(e) =>
                                    router.get(
                                        classroomRoute.url(classroom.id),
                                        { fecha: e.target.value },
                                    )
                                }
                            />
                        </label>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={report(classroom.id)}>
                                <FileBarChart /> Reporte del mes
                            </Link>
                        </Button>
                    </div>
                </header>

                {!isBusinessDay && (
                    <p className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                        <AlertTriangle className="size-4" /> Este día no es
                        hábil (fin de semana o feriado).
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-sm">
                    {statuses.map((s) => (
                        <span
                            key={s.value}
                            className="rounded-full bg-muted px-3 py-1"
                        >
                            {s.label}: <strong>{counts[s.value]}</strong>
                        </span>
                    ))}
                    {missing > 0 && (
                        <span className="text-muted-foreground">
                            · {missing} sin marcar
                        </span>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() =>
                            setData(
                                'entries',
                                data.entries.map((entry) =>
                                    entry.status === ''
                                        ? {
                                              ...entry,
                                              status: 'presente',
                                              arrived_at:
                                                  entry.arrived_at ||
                                                  (isToday ? nowTime() : ''),
                                          }
                                        : entry,
                                ),
                            )
                        }
                    >
                        <CheckCheck /> Marcar el resto como presentes
                    </Button>
                </div>

                <ul className="space-y-3">
                    {students.map((student, index) => {
                        const entry = data.entries[index];
                        const attended =
                            entry.status === 'presente' ||
                            entry.status === 'tardanza';

                        return (
                            <li
                                key={student.enrollment_id}
                                className="space-y-3 rounded-2xl border bg-card p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        {student.photo ? (
                                            <img
                                                src={student.photo}
                                                alt=""
                                                className="size-11 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="flex size-11 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground">
                                                {student.name[0]}
                                            </span>
                                        )}
                                        <div>
                                            <Link
                                                href={showStudent(
                                                    student.student_id,
                                                )}
                                                className="font-semibold hover:underline"
                                            >
                                                {student.name}
                                            </Link>
                                            {student.allergies && (
                                                <p className="text-xs text-red-700">
                                                    ⚠ Alergias:{' '}
                                                    {student.allergies}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {statuses.map((s) => (
                                            <button
                                                key={s.value}
                                                type="button"
                                                onClick={() =>
                                                    setStatus(index, s.value)
                                                }
                                                className={cn(
                                                    'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                                                    entry.status === s.value
                                                        ? s.className
                                                        : 'bg-background hover:bg-accent',
                                                )}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {attended && (
                                    <div className="grid gap-2 sm:grid-cols-[7rem_7rem_1fr]">
                                        <label className="grid gap-1 text-xs text-muted-foreground">
                                            Llegó
                                            <Input
                                                type="time"
                                                value={entry.arrived_at}
                                                onChange={(e) =>
                                                    update(index, {
                                                        arrived_at:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </label>
                                        <label className="grid gap-1 text-xs text-muted-foreground">
                                            Salió
                                            <Input
                                                type="time"
                                                value={entry.left_at}
                                                onChange={(e) =>
                                                    update(index, {
                                                        left_at: e.target.value,
                                                    })
                                                }
                                            />
                                        </label>
                                        <label className="grid gap-1 text-xs text-muted-foreground">
                                            Lo recogió
                                            <NativeSelect
                                                value={
                                                    student.pickups.includes(
                                                        entry.picked_up_by,
                                                    ) ||
                                                    entry.picked_up_by === ''
                                                        ? entry.picked_up_by
                                                        : '__otro'
                                                }
                                                placeholder="—"
                                                options={[
                                                    ...student.pickups.map(
                                                        (p) => ({
                                                            value: p,
                                                            label: p,
                                                        }),
                                                    ),
                                                    {
                                                        value: '__otro',
                                                        label: 'Otra persona…',
                                                    },
                                                ]}
                                                onChange={(e) =>
                                                    update(index, {
                                                        picked_up_by:
                                                            e.target.value ===
                                                            '__otro'
                                                                ? (prompt(
                                                                      'Nombre y DNI de quien lo recoge:',
                                                                  ) ?? '')
                                                                : e.target
                                                                      .value,
                                                        left_at:
                                                            entry.left_at ||
                                                            (isToday &&
                                                            e.target.value
                                                                ? nowTime()
                                                                : entry.left_at),
                                                    })
                                                }
                                            />
                                        </label>
                                    </div>
                                )}
                                {entry.picked_up_by &&
                                    !student.pickups.includes(
                                        entry.picked_up_by,
                                    ) && (
                                        <p className="text-xs text-amber-800">
                                            Recogido por persona no registrada:{' '}
                                            {entry.picked_up_by}
                                        </p>
                                    )}
                                {entry.status !== '' && (
                                    <Input
                                        placeholder="Observación (opcional)"
                                        value={entry.notes}
                                        onChange={(e) =>
                                            update(index, {
                                                notes: e.target.value,
                                            })
                                        }
                                    />
                                )}
                            </li>
                        );
                    })}
                </ul>

                {students.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Este salón aún no tiene alumnos matriculados.
                    </p>
                )}
                <InputError message={errors.entries} />

                <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-3 backdrop-blur md:sticky md:bottom-4 md:rounded-2xl md:border">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                            {missing > 0
                                ? `${missing} sin marcar`
                                : 'Todos marcados ✓'}
                        </span>
                        <Button type="submit" size="lg" disabled={processing}>
                            Guardar asistencia
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
}

ClassroomAttendance.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: `Salón ${props.classroom.name}`,
            href: show(props.classroom.id),
        },
        { title: 'Asistencia', href: classroomRoute(props.classroom.id) },
    ],
});
