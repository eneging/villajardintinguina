import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Circle, Star } from 'lucide-react';
import Heading from '@/components/heading';
import { mine, show } from '@/routes/induction';
import type { InductionLessonCard } from '@/types';

type Group = {
    audience: 'parents' | 'staff';
    label: string;
    lessons: InductionLessonCard[];
};

export default function InductionMine({ groups }: { groups: Group[] }) {
    return (
        <>
            <Head title="Mi inducción" />
            <div className="mx-auto w-full max-w-3xl space-y-8 p-4">
                <Heading
                    title="Mi inducción"
                    description="Conoce cómo trabajamos. Las lecciones marcadas con ★ son obligatorias."
                />

                {groups.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Aún no hay lecciones de inducción para ti.
                    </p>
                )}

                {groups.map((group) => {
                    const done = group.lessons.filter(
                        (l) => l.completed,
                    ).length;
                    const percent = Math.round(
                        (done / group.lessons.length) * 100,
                    );

                    return (
                        <section key={group.audience} className="space-y-4">
                            {groups.length > 1 && (
                                <h2 className="text-lg font-semibold">
                                    {group.label}
                                </h2>
                            )}
                            <div className="rounded-2xl bg-green-50 p-4 dark:bg-green-950/40">
                                <div className="mb-2 flex justify-between text-sm font-medium">
                                    <span>Tu avance</span>
                                    <span>
                                        {done} de {group.lessons.length}
                                    </span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-green-100 dark:bg-green-900">
                                    <div
                                        className="h-full rounded-full bg-green-600 transition-all"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>

                            <ol className="space-y-3">
                                {group.lessons.map((lesson, index) => (
                                    <li key={lesson.id}>
                                        <Link
                                            href={show(lesson.id)}
                                            className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:shadow-md"
                                        >
                                            {lesson.cover?.thumbnail ? (
                                                <img
                                                    src={lesson.cover.thumbnail}
                                                    alt=""
                                                    className="size-16 shrink-0 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl font-bold text-amber-700">
                                                    {index + 1}
                                                </span>
                                            )}
                                            <span className="flex-1">
                                                <span className="flex items-center gap-1.5 font-semibold">
                                                    {lesson.title}
                                                    {lesson.is_required && (
                                                        <Star
                                                            className="size-4 fill-amber-400 text-amber-400"
                                                            aria-label="Obligatoria"
                                                        />
                                                    )}
                                                </span>
                                                {lesson.description && (
                                                    <span className="line-clamp-2 text-sm text-muted-foreground">
                                                        {lesson.description}
                                                    </span>
                                                )}
                                            </span>
                                            {lesson.completed ? (
                                                <CheckCircle2
                                                    className="size-7 shrink-0 text-green-600"
                                                    aria-label="Completada"
                                                />
                                            ) : (
                                                <Circle
                                                    className="size-7 shrink-0 text-muted-foreground/40"
                                                    aria-label="Pendiente"
                                                />
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    );
                })}
            </div>
        </>
    );
}

InductionMine.layout = {
    breadcrumbs: [{ title: 'Mi inducción', href: mine() }],
};
