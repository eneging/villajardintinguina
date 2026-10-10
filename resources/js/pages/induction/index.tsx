import { Head, Link } from '@inertiajs/react';
import { Plus, Users } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { create, index, progress, show } from '@/routes/induction';
import type { InductionLessonCard, InductionTargets } from '@/types';

type ClassroomOption = { value: number; label: string };

type Props = {
    lessons: InductionLessonCard[];
    classrooms: ClassroomOption[];
};

function targetLabel(targets: InductionTargets, classrooms: ClassroomOption[]) {
    if (targets.general) {
        return 'Todos';
    }

    const names = targets.classroom_ids.map(
        (id) => classrooms.find((c) => c.value === id)?.label ?? 'Salón',
    );

    if (targets.level_ids.length) {
        names.unshift(
            `${targets.level_ids.length} nivel${targets.level_ids.length > 1 ? 'es' : ''}`,
        );
    }

    return names.join(', ');
}

export default function InductionIndex({ lessons, classrooms }: Props) {
    const groups: { key: InductionLessonCard['audience']; title: string }[] = [
        { key: 'parents', title: 'Para padres de familia' },
        { key: 'staff', title: 'Para el personal' },
    ];

    return (
        <>
            <Head title="Gestionar inducción" />
            <div className="space-y-8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Gestionar inducción"
                        description="Lecciones con video, imágenes y texto para dar la bienvenida a las familias y al personal."
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> Nueva lección
                        </Link>
                    </Button>
                </div>

                {classrooms.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Avance por salón
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {classrooms.map((classroom) => (
                                <Button
                                    key={classroom.value}
                                    variant="outline"
                                    size="sm"
                                    asChild
                                >
                                    <Link href={progress(classroom.value)}>
                                        <Users /> {classroom.label}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </section>
                )}

                {groups.map(({ key, title }) => {
                    const items = lessons.filter((l) => l.audience === key);

                    if (items.length === 0) {
                        return null;
                    }

                    return (
                        <section key={key} className="space-y-3">
                            <h2 className="text-lg font-semibold">{title}</h2>
                            <div className="divide-y rounded-2xl border bg-card">
                                {items.map((lesson) => (
                                    <Link
                                        key={lesson.id}
                                        href={show(lesson.id)}
                                        className="flex flex-wrap items-center gap-3 p-4 transition hover:bg-accent"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-medium">
                                                {lesson.title}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                Dirigida a:{' '}
                                                {targetLabel(
                                                    lesson.targets,
                                                    classrooms,
                                                )}
                                            </span>
                                        </span>
                                        {lesson.is_required && (
                                            <Badge>Obligatoria</Badge>
                                        )}
                                        {lesson.status === 'draft' && (
                                            <Badge variant="secondary">
                                                Borrador
                                            </Badge>
                                        )}
                                        <span className="text-sm text-muted-foreground">
                                            {lesson.completed_count ?? 0}{' '}
                                            completaron
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    );
                })}

                {lessons.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Aún no hay lecciones. Crea la primera bienvenida para
                        las familias.
                    </p>
                )}
            </div>
        </>
    );
}

InductionIndex.layout = {
    breadcrumbs: [{ title: 'Gestionar inducción', href: index() }],
};
