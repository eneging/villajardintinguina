import { Head, Link } from '@inertiajs/react';
import { ListChecks, Plus } from 'lucide-react';
import { ModuleCard } from '@/components/school/module-card';
import { Button } from '@/components/ui/button';
import { moduleTiming } from '@/lib/school';
import { show } from '@/routes/classrooms';
import { progress } from '@/routes/induction';
import { create } from '@/routes/modules';
import type { ClassroomSummary, LearningModuleCard, MediaItem } from '@/types';

type Props = {
    classroom: ClassroomSummary & {
        description: string | null;
        cover: MediaItem | null;
    };
    modules: LearningModuleCard[];
    children: { id: number; name: string }[];
    canManage: boolean;
};

const staffLabels = {
    titular: 'Maestra',
    auxiliar: 'Auxiliar',
    practicante: 'Practicante',
} as const;

const sections = [
    { key: 'current', title: 'Esta semana' },
    { key: 'upcoming', title: 'Próximos' },
    { key: 'past', title: 'Anteriores' },
] as const;

export default function ClassroomShow({
    classroom,
    modules,
    children,
    canManage,
}: Props) {
    const drafts = modules.filter((m) => m.status === 'draft');
    const published = modules.filter((m) => m.status === 'published');

    return (
        <>
            <Head title={`Salón ${classroom.name}`} />

            <div className="space-y-8 p-4">
                <header
                    className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
                    style={{ backgroundColor: `${classroom.color}26` }}
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div
                            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white text-5xl shadow-sm"
                            aria-hidden
                        >
                            {classroom.mascot ?? '🏫'}
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">
                                {classroom.level} · Turno {classroom.shift}
                            </p>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Salón {classroom.name}
                            </h1>
                            {children.length > 0 && (
                                <p className="text-sm">
                                    Aquí estudia{children.length > 1 ? 'n' : ''}
                                    :{' '}
                                    <strong>
                                        {children.map((c) => c.name).join(', ')}
                                    </strong>
                                </p>
                            )}
                        </div>
                        {canManage && (
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" asChild>
                                    <Link href={progress(classroom.id)}>
                                        <ListChecks /> Avance de inducción
                                    </Link>
                                </Button>
                                <Button asChild>
                                    <Link href={create(classroom.id)}>
                                        <Plus /> Nuevo módulo
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {classroom.description && (
                        <p className="mt-4 max-w-2xl">
                            {classroom.description}
                        </p>
                    )}

                    {classroom.staff && classroom.staff.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-3">
                            {classroom.staff.map((member) => (
                                <div
                                    key={member.id}
                                    className="rounded-full bg-white/80 px-4 py-1.5 text-sm shadow-sm dark:bg-black/30"
                                >
                                    <span className="font-medium">
                                        {member.name}
                                    </span>{' '}
                                    <span className="text-muted-foreground">
                                        · {staffLabels[member.role]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </header>

                <section className="space-y-6">
                    <h2 className="text-xl font-semibold">
                        Módulos de aprendizaje
                    </h2>

                    {modules.length === 0 && (
                        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                            {canManage
                                ? 'Aún no hay módulos. Crea el primero para que los padres sepan qué aprenderán sus hijos.'
                                : 'La maestra pronto publicará lo que aprenderán los niños.'}
                        </p>
                    )}

                    {canManage && drafts.length > 0 && (
                        <ModuleGroup
                            title="Borradores"
                            modules={drafts}
                            color={classroom.color}
                        />
                    )}

                    {sections.map(({ key, title }) => (
                        <ModuleGroup
                            key={key}
                            title={title}
                            color={classroom.color}
                            modules={published.filter(
                                (m) =>
                                    moduleTiming(m.starts_on, m.ends_on) ===
                                    key,
                            )}
                        />
                    ))}
                </section>
            </div>
        </>
    );
}

function ModuleGroup({
    title,
    modules,
    color,
}: {
    title: string;
    modules: LearningModuleCard[];
    color: string;
}) {
    if (modules.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {title}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {modules.map((module) => (
                    <ModuleCard key={module.id} module={module} color={color} />
                ))}
            </div>
        </div>
    );
}

ClassroomShow.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: `Salón ${props.classroom.name}`,
            href: show(props.classroom.id),
        },
    ],
});
