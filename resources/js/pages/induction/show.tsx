import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import InductionController from '@/actions/App/Http/Controllers/InductionController';
import InputError from '@/components/input-error';
import { BlockRenderer } from '@/components/school/block-renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { destroy, edit, mine, show } from '@/routes/induction';
import type { InductionLessonDetail } from '@/types';

type Props = {
    lesson: InductionLessonDetail;
    progress: { completed_at: string; accepted_at: string | null } | null;
    requiresAcceptance: boolean;
    canComplete: boolean;
    canEdit: boolean;
};

const dateTime = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
});

export default function InductionShow({
    lesson,
    progress,
    requiresAcceptance,
    canComplete,
    canEdit,
}: Props) {
    const form = useForm({ accepted: false });

    return (
        <>
            <Head title={lesson.title} />
            <article className="mx-auto w-full max-w-3xl space-y-8 p-4 pb-16">
                <header className="overflow-hidden rounded-3xl bg-amber-50 dark:bg-amber-950/30">
                    {lesson.cover && (
                        <img
                            src={lesson.cover.url}
                            alt=""
                            className="max-h-80 w-full object-cover"
                        />
                    )}
                    <div className="space-y-3 p-6">
                        <div className="flex flex-wrap gap-2">
                            {lesson.is_required && <Badge>Obligatoria</Badge>}
                            {lesson.status === 'draft' && (
                                <Badge variant="secondary">
                                    Borrador — aún no es visible
                                </Badge>
                            )}
                            {lesson.audience === 'staff' && (
                                <Badge variant="outline">
                                    Para el personal
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {lesson.title}
                        </h1>
                        {lesson.description && (
                            <p className="text-base leading-relaxed">
                                {lesson.description}
                            </p>
                        )}
                        {canEdit && (
                            <div className="flex gap-2 pt-2">
                                <Button size="sm" asChild>
                                    <Link href={edit(lesson.id)}>
                                        <Pencil /> Editar
                                    </Link>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                '¿Eliminar esta lección? También se borrará el avance de los padres.',
                                            )
                                        ) {
                                            router.delete(
                                                destroy.url(lesson.id),
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

                <div className="space-y-6">
                    {lesson.blocks.map((block, index) => (
                        <BlockRenderer key={block.id ?? index} block={block} />
                    ))}
                </div>

                {canComplete &&
                    (progress ? (
                        <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-5 text-green-900 dark:bg-green-950/40 dark:text-green-100">
                            <CheckCircle2 className="size-6 shrink-0 text-green-600" />
                            <p>
                                Completaste esta lección el{' '}
                                {dateTime.format(
                                    new Date(progress.completed_at),
                                )}
                                {progress.accepted_at &&
                                    ' y aceptaste lo indicado'}
                                .
                            </p>
                        </div>
                    ) : (
                        <form
                            className="space-y-4 rounded-2xl border bg-card p-5"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.submit(
                                    InductionController.complete(lesson.id),
                                    { preserveScroll: true },
                                );
                            }}
                        >
                            {requiresAcceptance && (
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="accepted"
                                        checked={form.data.accepted}
                                        onCheckedChange={(checked) =>
                                            form.setData(
                                                'accepted',
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="accepted"
                                        className="leading-snug"
                                    >
                                        Leí la lección y acepto lo indicado
                                        arriba.
                                    </Label>
                                </div>
                            )}
                            <InputError message={form.errors.accepted} />
                            <Button
                                type="submit"
                                size="lg"
                                disabled={form.processing}
                            >
                                <CheckCircle2 /> Marcar como completada
                            </Button>
                        </form>
                    ))}
            </article>
        </>
    );
}

InductionShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Inducción', href: mine() },
        { title: props.lesson.title, href: show(props.lesson.id) },
    ],
});
