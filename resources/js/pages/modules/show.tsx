import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { BlockRenderer } from '@/components/school/block-renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { areaColors, formatRange } from '@/lib/school';
import { cn } from '@/lib/utils';
import { show as showClassroom } from '@/routes/classrooms';
import { destroy, edit, show } from '@/routes/modules';
import type { LearningModuleDetail } from '@/types';

type Props = {
    module: LearningModuleDetail;
    classroom: {
        id: number;
        name: string;
        level: string;
        color: string;
        mascot: string | null;
    };
    canEdit: boolean;
};

export default function ModuleShow({ module, classroom, canEdit }: Props) {
    return (
        <>
            <Head title={module.title} />

            <article className="mx-auto w-full max-w-3xl space-y-8 p-4 pb-16">
                <header
                    className="overflow-hidden rounded-3xl"
                    style={{ backgroundColor: `${classroom.color}1f` }}
                >
                    {module.cover && (
                        <img
                            src={module.cover.url}
                            alt=""
                            className="max-h-80 w-full object-cover"
                        />
                    )}
                    <div className="space-y-3 p-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={cn(
                                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                    areaColors[module.area] ?? 'bg-muted',
                                )}
                            >
                                {module.area_label}
                            </span>
                            {module.status === 'draft' && (
                                <Badge variant="secondary">
                                    Borrador — los padres aún no lo ven
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {module.title}
                        </h1>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="size-4" />
                            {formatRange(
                                module.starts_on,
                                module.ends_on,
                            )} ·{' '}
                            {classroom.mascot} {classroom.name}
                            {module.author && <> · {module.author}</>}
                        </p>
                        {module.summary && (
                            <p className="text-base leading-relaxed">
                                {module.summary}
                            </p>
                        )}
                        {canEdit && (
                            <div className="flex gap-2 pt-2">
                                <Button size="sm" asChild>
                                    <Link href={edit(module.id)}>
                                        <Pencil /> Editar
                                    </Link>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                '¿Eliminar este módulo? Esta acción no se puede deshacer.',
                                            )
                                        ) {
                                            router.delete(
                                                destroy.url(module.id),
                                            );
                                        }
                                    }}
                                >
                                    <Trash2 /> Eliminar
                                </Button>
                            </div>
                        )}
                    </div>
                </header>

                {module.goals.length > 0 && (
                    <section className="rounded-2xl border bg-card p-6">
                        <h2 className="mb-3 text-lg font-semibold">
                            ¿Qué aprenderán?
                        </h2>
                        <ul className="space-y-2">
                            {module.goals.map((goal) => (
                                <li key={goal} className="flex gap-2">
                                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                                    <span>{goal}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <div className="space-y-6">
                    {module.blocks.map((block, index) => (
                        <BlockRenderer key={block.id ?? index} block={block} />
                    ))}
                </div>
            </article>
        </>
    );
}

ModuleShow.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: props.classroom.name,
            href: showClassroom(props.classroom.id),
        },
        { title: props.module.title, href: show(props.module.id) },
    ],
});
