import { Head, router } from '@inertiajs/react';
import { BadgeCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handOver } from '@/routes/pickups';

type Props = {
    token: string;
    person: {
        name: string;
        dni: string | null;
        relationship: string;
        phone: string | null;
        photo: string | null;
        kind: string;
    };
    students: {
        id: number;
        name: string;
        photo: string | null;
        classroom: string;
        status: string | null;
        left_at: string | null;
        picked_up_by: string | null;
    }[];
};

export default function PickupScan({ token, person, students }: Props) {
    return (
        <>
            <Head title="Recojo" />
            <div className="mx-auto w-full max-w-md space-y-5 p-4">
                <section className="flex items-center gap-4 rounded-3xl border-2 border-green-600 bg-green-50 p-5 dark:bg-green-950/40">
                    {person.photo ? (
                        <img
                            src={person.photo}
                            alt=""
                            className="size-24 rounded-2xl object-cover"
                        />
                    ) : (
                        <span className="flex size-24 items-center justify-center rounded-2xl bg-green-200 text-4xl font-bold text-green-900">
                            {person.name[0]}
                        </span>
                    )}
                    <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-xs font-semibold tracking-wide text-green-700 uppercase dark:text-green-300">
                            <BadgeCheck className="size-4" /> {person.kind}
                        </p>
                        <p className="text-xl font-bold">{person.name}</p>
                        <p className="text-sm">{person.relationship}</p>
                        <p className="text-lg font-semibold tabular-nums">
                            DNI {person.dni ?? '—'}
                        </p>
                    </div>
                </section>
                <p className="text-sm text-muted-foreground">
                    Verifica que el DNI coincida con el documento de la persona
                    antes de entregar al niño.
                </p>
                <ul className="space-y-3">
                    {students.map((student) => (
                        <li
                            key={student.id}
                            className="flex items-center gap-3 rounded-2xl border bg-card p-4"
                        >
                            {student.photo ? (
                                <img
                                    src={student.photo}
                                    alt=""
                                    className="size-14 rounded-full object-cover"
                                />
                            ) : (
                                <span className="flex size-14 items-center justify-center rounded-full bg-muted text-xl font-semibold">
                                    {student.name[0]}
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold">{student.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Salón {student.classroom}
                                    {student.status === 'falta' &&
                                        ' · hoy no asistió'}
                                </p>
                                {student.left_at && (
                                    <p className="text-xs text-green-700 dark:text-green-400">
                                        Entregado a las {student.left_at}
                                    </p>
                                )}
                            </div>
                            {!student.left_at && student.status !== 'falta' && (
                                <Button
                                    onClick={() =>
                                        router.post(
                                            handOver.url(token),
                                            { student_id: student.id },
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <LogOut /> Entregar
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}
