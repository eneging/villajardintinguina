import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, Plus, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DailyLogController from '@/actions/App/Http/Controllers/DailyLogController';
import InputError from '@/components/input-error';
import { MediaUploader } from '@/components/school/media-uploader';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localToday } from '@/lib/school';
import { cn } from '@/lib/utils';
import { show as showClassroom } from '@/routes/classrooms';
import { classroom as classroomRoute } from '@/routes/daily-logs';
import type { DailyLogEntry, DailyLogOptions, MediaItem } from '@/types';

type StudentRow = {
    id: number;
    name: string;
    photo: string | null;
    allergies: string | null;
    log: DailyLogEntry | null;
};

type Props = {
    classroom: {
        id: number;
        name: string;
        color: string;
        mascot: string | null;
    };
    date: string;
    students: StudentRow[];
    options: DailyLogOptions;
    canUpload: boolean;
};

const textareaClass =
    'min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

function nowTime(): string {
    const now = new Date();

    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function Chip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                active
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'hover:bg-accent',
            )}
        >
            {children}
        </button>
    );
}

function Editor({
    classroomId,
    date,
    student,
    options,
    canUpload,
    onClose,
}: {
    classroomId: number;
    date: string;
    student: StudentRow;
    options: DailyLogOptions;
    canUpload: boolean;
    onClose: () => void;
}) {
    const log = student.log;
    const [photo, setPhoto] = useState<MediaItem | null>(log?.photo ?? null);
    const form = useForm({
        date,
        meals: (log?.meals ?? []).map((m) => ({
            moment: m.moment,
            amount: m.amount,
            note: m.note ?? '',
        })),
        naps: (log?.naps ?? []).map((n) => ({ from: n.from, to: n.to ?? '' })),
        diapers: log?.diapers ?? [],
        mood: log?.mood ?? '',
        note: log?.note ?? '',
        needs: log?.needs ?? '',
        photo_media_id: log?.photo_media_id ?? (null as number | null),
        send: false,
    });
    const { data, setData } = form;
    const errors = form.errors as Record<string, string | undefined>;

    function setMeal(moment: string, amount: string) {
        const exists = data.meals.find((m) => m.moment === moment);
        setData(
            'meals',
            exists?.amount === amount
                ? data.meals.filter((m) => m.moment !== moment)
                : exists
                  ? data.meals.map((m) =>
                        m.moment === moment ? { ...m, amount } : m,
                    )
                  : [...data.meals, { moment, amount, note: '' }],
        );
    }

    function submit(send: boolean) {
        form.transform((values) => ({
            ...values,
            mood: values.mood || null,
            naps: values.naps.map((n) => ({ from: n.from, to: n.to || null })),
            send,
        }));
        form.submit(DailyLogController.save([classroomId, student.id]), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    return (
        <div className="space-y-5">
            <section className="space-y-2">
                <Label>¿Cómo estuvo hoy?</Label>
                <div className="flex flex-wrap gap-2">
                    {options.moods.map((mood) => (
                        <button
                            key={mood.value}
                            type="button"
                            aria-pressed={data.mood === mood.value}
                            onClick={() =>
                                setData(
                                    'mood',
                                    data.mood === mood.value ? '' : mood.value,
                                )
                            }
                            className={cn(
                                'flex flex-col items-center rounded-2xl border px-3 py-2 text-xs transition',
                                data.mood === mood.value
                                    ? 'border-green-600 bg-green-50 dark:bg-green-950'
                                    : 'hover:bg-accent',
                            )}
                        >
                            <span className="text-2xl" aria-hidden>
                                {mood.emoji}
                            </span>
                            {mood.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-2">
                <Label>Comidas</Label>
                {options.moments.map((moment) => {
                    const current = data.meals.find(
                        (m) => m.moment === moment.value,
                    );

                    return (
                        <div key={moment.value} className="space-y-1">
                            <p className="text-sm font-medium">
                                {moment.label}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {options.amounts.map((amount) => (
                                    <Chip
                                        key={amount.value}
                                        active={
                                            current?.amount === amount.value
                                        }
                                        onClick={() =>
                                            setMeal(moment.value, amount.value)
                                        }
                                    >
                                        {amount.label}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </section>

            <section className="space-y-2">
                <Label>Siesta</Label>
                {data.naps.map((nap, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            type="time"
                            aria-label="Se durmió"
                            value={nap.from}
                            onChange={(e) =>
                                setData(
                                    'naps',
                                    data.naps.map((n, i) =>
                                        i === index
                                            ? { ...n, from: e.target.value }
                                            : n,
                                    ),
                                )
                            }
                        />
                        <span className="text-sm">a</span>
                        <Input
                            type="time"
                            aria-label="Despertó"
                            value={nap.to}
                            onChange={(e) =>
                                setData(
                                    'naps',
                                    data.naps.map((n, i) =>
                                        i === index
                                            ? { ...n, to: e.target.value }
                                            : n,
                                    ),
                                )
                            }
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Quitar siesta"
                            onClick={() =>
                                setData(
                                    'naps',
                                    data.naps.filter((_, i) => i !== index),
                                )
                            }
                        >
                            <Trash2 />
                        </Button>
                    </div>
                ))}
                <InputError
                    message={
                        Object.entries(errors).find(([k]) =>
                            k.startsWith('naps'),
                        )?.[1]
                    }
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setData('naps', [
                            ...data.naps,
                            { from: nowTime(), to: '' },
                        ])
                    }
                >
                    <Plus /> Se durmió ahora
                </Button>
            </section>

            <section className="space-y-2">
                <Label>Pañal / baño</Label>
                <div className="flex flex-wrap gap-1.5">
                    {options.diapers.map((type) => (
                        <Button
                            key={type.value}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setData('diapers', [
                                    ...data.diapers,
                                    { time: nowTime(), type: type.value },
                                ])
                            }
                        >
                            <Plus /> {type.label}
                        </Button>
                    ))}
                </div>
                {data.diapers.length > 0 && (
                    <ul className="divide-y rounded-xl border text-sm">
                        {data.diapers.map((diaper, index) => (
                            <li
                                key={index}
                                className="flex items-center gap-2 px-3 py-1.5"
                            >
                                <Clock className="size-4 text-muted-foreground" />
                                <Input
                                    type="time"
                                    className="h-8 w-28"
                                    aria-label="Hora"
                                    value={diaper.time}
                                    onChange={(e) =>
                                        setData(
                                            'diapers',
                                            data.diapers.map((d, i) =>
                                                i === index
                                                    ? {
                                                          ...d,
                                                          time: e.target.value,
                                                      }
                                                    : d,
                                            ),
                                        )
                                    }
                                />
                                <span className="flex-1">
                                    {
                                        options.diapers.find(
                                            (o) => o.value === diaper.type,
                                        )?.label
                                    }
                                </span>
                                <button
                                    type="button"
                                    aria-label="Quitar"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                        setData(
                                            'diapers',
                                            data.diapers.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="grid gap-2">
                <Label htmlFor="log-note">Mensaje para la familia</Label>
                <textarea
                    id="log-note"
                    className={textareaClass}
                    placeholder="Hoy jugó con plastilina y cantó en la ronda…"
                    value={data.note}
                    onChange={(e) => setData('note', e.target.value)}
                />
                <Label htmlFor="log-needs">Necesita traer</Label>
                <Input
                    id="log-needs"
                    placeholder="Pañales, toallitas, una muda de ropa…"
                    value={data.needs}
                    onChange={(e) => setData('needs', e.target.value)}
                />
            </section>

            <section className="space-y-2">
                <Label>Foto del día</Label>
                {photo?.thumbnail && (
                    <img
                        src={photo.thumbnail}
                        alt=""
                        className="h-32 rounded-xl object-cover"
                    />
                )}
                <div className="flex gap-2">
                    <MediaUploader
                        target={{
                            context: 'classroom',
                            classroom_id: classroomId,
                        }}
                        resourceType="image"
                        label={photo ? 'Cambiar foto' : 'Subir foto'}
                        disabled={!canUpload}
                        onUploaded={(media) => {
                            setPhoto(media);
                            setData('photo_media_id', media.id);
                        }}
                    />
                    {photo && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setPhoto(null);
                                setData('photo_media_id', null);
                            }}
                        >
                            Quitar
                        </Button>
                    )}
                </div>
                <InputError message={errors.photo_media_id} />
            </section>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button
                    type="button"
                    variant="outline"
                    disabled={form.processing}
                    onClick={() => submit(false)}
                >
                    Guardar borrador
                </Button>
                <Button
                    type="button"
                    disabled={form.processing}
                    onClick={() => submit(true)}
                >
                    <Send />{' '}
                    {log?.sent_at ? 'Actualizar' : 'Enviar a la familia'}
                </Button>
            </div>
        </div>
    );
}

export default function DailyLogsClassroom({
    classroom,
    date,
    students,
    options,
    canUpload,
}: Props) {
    const [editing, setEditing] = useState<StudentRow | null>(null);
    const sent = students.filter((s) => s.log?.sent_at).length;

    return (
        <>
            <Head title={`Cuaderno · ${classroom.name}`} />
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <header
                    className="space-y-3 rounded-3xl p-5"
                    style={{ backgroundColor: `${classroom.color}22` }}
                >
                    <h1 className="text-2xl font-bold">
                        {classroom.mascot} Cuaderno diario · {classroom.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <Input
                            type="date"
                            className="w-auto bg-background"
                            aria-label="Fecha"
                            value={date}
                            max={localToday()}
                            onChange={(e) =>
                                router.get(
                                    classroomRoute.url(classroom.id),
                                    { fecha: e.target.value },
                                    { preserveState: false },
                                )
                            }
                        />
                        <span className="text-sm">
                            {sent} de {students.length} enviados a las familias
                        </span>
                    </div>
                </header>

                <ul className="grid gap-3 sm:grid-cols-2">
                    {students.map((student) => {
                        const status = student.log?.sent_at
                            ? 'sent'
                            : student.log
                              ? 'draft'
                              : 'empty';
                        const mood = options.moods.find(
                            (m) => m.value === student.log?.mood,
                        );

                        return (
                            <li key={student.id}>
                                <button
                                    type="button"
                                    onClick={() => setEditing(student)}
                                    className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition hover:shadow-md"
                                >
                                    {student.photo ? (
                                        <img
                                            src={student.photo}
                                            alt=""
                                            className="size-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                                            {student.name[0]}
                                        </span>
                                    )}
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-semibold">
                                            {student.name}
                                        </span>
                                        {student.allergies && (
                                            <span className="block text-xs text-red-700">
                                                ⚠ {student.allergies}
                                            </span>
                                        )}
                                        <span
                                            className={cn(
                                                'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                                status === 'sent' &&
                                                    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
                                                status === 'draft' &&
                                                    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
                                                status === 'empty' &&
                                                    'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            {status === 'sent' && (
                                                <CheckCircle2 className="size-3" />
                                            )}
                                            {status === 'sent'
                                                ? 'Enviado'
                                                : status === 'draft'
                                                  ? 'Borrador'
                                                  : 'Sin registrar'}
                                        </span>
                                    </span>
                                    {mood && (
                                        <span
                                            className="text-3xl"
                                            aria-label={mood.label}
                                        >
                                            {mood.emoji}
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
                {students.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        No hay alumnos matriculados en este salón.
                    </p>
                )}
            </div>

            <Dialog
                open={editing !== null}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editing?.name}</DialogTitle>
                    </DialogHeader>
                    {editing && (
                        <Editor
                            key={`${editing.id}-${date}`}
                            classroomId={classroom.id}
                            date={date}
                            student={editing}
                            options={options}
                            canUpload={canUpload}
                            onClose={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

DailyLogsClassroom.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: `Salón ${props.classroom.name}`,
            href: showClassroom(props.classroom.id),
        },
        { title: 'Cuaderno diario', href: classroomRoute(props.classroom.id) },
    ],
});
