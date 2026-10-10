import { Head } from '@inertiajs/react';
import { CheckCircle2, Circle, MessageCircle } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { show as showClassroom } from '@/routes/classrooms';
import { progress } from '@/routes/induction';

type Parent = {
    id: number;
    name: string;
    phone: string | null;
    children: string[];
    completed: number[];
};

type Props = {
    classroom: {
        id: number;
        name: string;
        level: string;
        color: string;
        mascot: string | null;
    };
    lessons: { id: number; title: string }[];
    parents: Parent[];
};

/** Enlace de WhatsApp con el recordatorio prellenado (Perú: +51). */
function reminderLink(parent: Parent, pending: string[]): string | null {
    const digits = parent.phone?.replace(/\D/g, '') ?? '';

    if (digits.length < 9) {
        return null;
    }

    const phone = digits.length === 9 ? `51${digits}` : digits;
    const text = `Hola ${parent.name.split(' ')[0]}, le recordamos completar la inducción de EP Villa Jardín en la plataforma: ${pending.join(', ')}. ¡Gracias!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default function InductionProgress({
    classroom,
    lessons,
    parents,
}: Props) {
    const finished = parents.filter((p) =>
        lessons.every((l) => p.completed.includes(l.id)),
    ).length;

    return (
        <>
            <Head title={`Inducción · ${classroom.name}`} />
            <div className="space-y-6 p-4">
                <Heading
                    title={`${classroom.mascot ?? ''} Avance de inducción — ${classroom.name}`}
                    description={`${finished} de ${parents.length} familias completaron todas las lecciones obligatorias.`}
                />

                {lessons.length === 0 ? (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        No hay lecciones obligatorias publicadas para este
                        salón.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border bg-card">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3 font-medium">Familia</th>
                                    {lessons.map((lesson) => (
                                        <th
                                            key={lesson.id}
                                            className="p-3 text-center font-medium"
                                        >
                                            {lesson.title}
                                        </th>
                                    ))}
                                    <th className="p-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {parents.map((parent) => {
                                    const pending = lessons
                                        .filter(
                                            (l) =>
                                                !parent.completed.includes(
                                                    l.id,
                                                ),
                                        )
                                        .map((l) => l.title);
                                    const link = pending.length
                                        ? reminderLink(parent, pending)
                                        : null;

                                    return (
                                        <tr key={parent.id}>
                                            <td className="p-3">
                                                <div className="font-medium">
                                                    {parent.name}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {parent.children.join(', ')}
                                                </div>
                                            </td>
                                            {lessons.map((lesson) => (
                                                <td
                                                    key={lesson.id}
                                                    className="p-3 text-center"
                                                >
                                                    {parent.completed.includes(
                                                        lesson.id,
                                                    ) ? (
                                                        <CheckCircle2
                                                            className="mx-auto size-5 text-green-600"
                                                            aria-label="Completada"
                                                        />
                                                    ) : (
                                                        <Circle
                                                            className="mx-auto size-5 text-muted-foreground/40"
                                                            aria-label="Pendiente"
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                            <td className="p-3 text-right">
                                                {link && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        asChild
                                                    >
                                                        <a
                                                            href={link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <MessageCircle />{' '}
                                                            Recordar
                                                        </a>
                                                    </Button>
                                                )}
                                                {pending.length > 0 &&
                                                    !link && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Sin celular
                                                        </span>
                                                    )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

InductionProgress.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: `Salón ${props.classroom.name}`,
            href: showClassroom(props.classroom.id),
        },
        { title: 'Avance de inducción', href: progress(props.classroom.id) },
    ],
});
