import { Head, router } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { show as showClassroom } from '@/routes/classrooms';
import { show, toggle } from '@/routes/supplies';
import { cn } from '@/lib/utils';

type Props = {
    classroom: {
        id: number;
        name: string;
        color: string;
        mascot: string | null;
    };
    items: string[];
    students: { id: number; name: string; delivered: string[] }[];
};

export default function SuppliesClassroom({
    classroom,
    items,
    students,
}: Props) {
    return (
        <>
            <Head title={`Útiles · ${classroom.name}`} />
            <div className="space-y-6 p-4">
                <header
                    className="rounded-3xl p-5"
                    style={{ backgroundColor: `${classroom.color}22` }}
                >
                    <h1 className="text-2xl font-bold">
                        {classroom.mascot} Útiles entregados · {classroom.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Toca una casilla cuando el niño entregue el útil. La
                        familia ve en la ficha lo que falta.
                    </p>
                </header>
                {items.length === 0 ? (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Primero agrega la lista de útiles en la información del
                        salón.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border bg-card">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="sticky left-0 bg-muted p-3 text-left font-medium">
                                        Alumno
                                    </th>
                                    {items.map((item) => (
                                        <th
                                            key={item}
                                            className="min-w-28 p-2 text-center text-xs font-medium"
                                        >
                                            {item}
                                        </th>
                                    ))}
                                    <th className="p-3 text-right font-medium">
                                        Avance
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td className="sticky left-0 bg-card p-3 font-medium">
                                            {student.name}
                                        </td>
                                        {items.map((item) => {
                                            const delivered =
                                                student.delivered.includes(
                                                    item,
                                                );

                                            return (
                                                <td
                                                    key={item}
                                                    className="p-2 text-center"
                                                >
                                                    <button
                                                        type="button"
                                                        aria-pressed={delivered}
                                                        aria-label={`${item} de ${student.name}`}
                                                        onClick={() =>
                                                            router.post(
                                                                toggle.url(
                                                                    classroom.id,
                                                                ),
                                                                {
                                                                    student_id:
                                                                        student.id,
                                                                    item,
                                                                    delivered:
                                                                        !delivered,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                    preserveState: true,
                                                                },
                                                            )
                                                        }
                                                        className={cn(
                                                            'inline-flex size-8 items-center justify-center rounded-lg border transition',
                                                            delivered
                                                                ? 'border-green-600 bg-green-600 text-white'
                                                                : 'hover:bg-accent',
                                                        )}
                                                    >
                                                        {delivered && (
                                                            <Check className="size-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                        <td className="p-3 text-right tabular-nums">
                                            {
                                                student.delivered.filter((d) =>
                                                    items.includes(d),
                                                ).length
                                            }
                                            /{items.length}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

SuppliesClassroom.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: `Salón ${props.classroom.name}`,
            href: showClassroom(props.classroom.id),
        },
        { title: 'Útiles', href: show(props.classroom.id) },
    ],
});
