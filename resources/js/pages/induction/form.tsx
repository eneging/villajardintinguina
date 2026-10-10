import { Head, Link, useForm } from '@inertiajs/react';
import InductionController from '@/actions/App/Http/Controllers/InductionController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import {
    BlockEditor,
    textareaClass,
    toBlockForms,
    toBlockPayload,
} from '@/components/school/block-editor';
import type { BlockForm } from '@/components/school/block-editor';
import { CoverField } from '@/components/school/cover-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index, show } from '@/routes/induction';
import type {
    InductionLessonDetail,
    InductionTargets,
    ModuleStatus,
} from '@/types';

type NumberOption = { value: number; label: string };

type Props = {
    lesson: InductionLessonDetail | null;
    isAdmin: boolean;
    levels: NumberOption[];
    classrooms: NumberOption[];
    cloudinaryEnabled: boolean;
};

type LessonForm = {
    title: string;
    description: string;
    audience: 'parents' | 'staff';
    is_required: boolean;
    status: ModuleStatus;
    position: number;
    cover_media_id: number | null;
    targets: InductionTargets;
    blocks: BlockForm[];
};

function toggle(list: number[], id: number, checked: boolean): number[] {
    return checked ? [...list, id] : list.filter((value) => value !== id);
}

export default function InductionForm({
    lesson,
    isAdmin,
    levels,
    classrooms,
    cloudinaryEnabled,
}: Props) {
    const target = { context: 'induction' } as const;
    const form = useForm<LessonForm>({
        title: lesson?.title ?? '',
        description: lesson?.description ?? '',
        audience: lesson?.audience ?? 'parents',
        is_required: lesson?.is_required ?? false,
        status: lesson?.status ?? 'draft',
        position: lesson?.position ?? 0,
        cover_media_id: lesson?.cover_media_id ?? null,
        targets: lesson?.targets ?? {
            general: isAdmin,
            level_ids: [],
            classroom_ids: [],
        },
        blocks: toBlockForms(lesson?.blocks),
    });
    const { data, setData, errors, processing } = form;
    const allErrors = errors as Record<string, string | undefined>;

    function setTargets(patch: Partial<InductionTargets>) {
        setData('targets', { ...data.targets, ...patch });
    }

    function submit(status: ModuleStatus) {
        form.transform((values) => ({
            ...values,
            status,
            blocks: toBlockPayload(values.blocks),
        }));

        form.submit(
            lesson
                ? InductionController.update(lesson.id)
                : InductionController.store(),
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title={lesson ? 'Editar lección' : 'Nueva lección'} />

            <div className="mx-auto w-full max-w-3xl space-y-8 p-4 pb-24">
                <Heading
                    title={
                        lesson
                            ? 'Editar lección de inducción'
                            : 'Nueva lección de inducción'
                    }
                    description="Combina video, imágenes y texto. Agrega una casilla de aceptación si los padres deben confirmar que leyeron."
                />

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Protocolo de recojo"
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción corta</Label>
                        <textarea
                            id="description"
                            className={textareaClass}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="is_required"
                            checked={data.is_required}
                            onCheckedChange={(checked) =>
                                setData('is_required', checked === true)
                            }
                        />
                        <Label htmlFor="is_required">
                            Obligatoria (aparece en el tablero de avance)
                        </Label>
                    </div>

                    <div className="grid gap-2 sm:w-40">
                        <Label htmlFor="position">Orden</Label>
                        <Input
                            id="position"
                            type="number"
                            min={0}
                            value={data.position}
                            onChange={(e) =>
                                setData('position', Number(e.target.value))
                            }
                        />
                    </div>

                    <CoverField
                        target={target}
                        initial={lesson?.cover ?? null}
                        hasCover={data.cover_media_id !== null}
                        disabled={!cloudinaryEnabled}
                        onChange={(id) => setData('cover_media_id', id)}
                    />
                </section>

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <Heading
                        variant="small"
                        title="¿Para quién es?"
                        description={
                            isAdmin
                                ? 'Elige si es para todos, para ciertos niveles o para salones específicos.'
                                : 'Elige los salones a los que va dirigida.'
                        }
                    />

                    {isAdmin && (
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    ['parents', 'Padres de familia'],
                                    ['staff', 'Maestras y practicantes'],
                                ] as const
                            ).map(([value, label]) => (
                                <Button
                                    key={value}
                                    type="button"
                                    size="sm"
                                    variant={
                                        data.audience === value
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setData('audience', value)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    )}
                    <InputError message={errors.audience} />

                    {isAdmin && (
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="general"
                                checked={data.targets.general}
                                onCheckedChange={(checked) =>
                                    setTargets({ general: checked === true })
                                }
                            />
                            <Label htmlFor="general">
                                Todos (inducción general)
                            </Label>
                        </div>
                    )}

                    {!data.targets.general && (
                        <div className="grid gap-6 sm:grid-cols-2">
                            {levels.length > 0 && (
                                <fieldset className="space-y-2">
                                    <legend className="mb-2 text-sm font-medium">
                                        Niveles
                                    </legend>
                                    {levels.map((level) => (
                                        <div
                                            key={level.value}
                                            className="flex items-center gap-3"
                                        >
                                            <Checkbox
                                                id={`level-${level.value}`}
                                                checked={data.targets.level_ids.includes(
                                                    level.value,
                                                )}
                                                onCheckedChange={(checked) =>
                                                    setTargets({
                                                        level_ids: toggle(
                                                            data.targets
                                                                .level_ids,
                                                            level.value,
                                                            checked === true,
                                                        ),
                                                    })
                                                }
                                            />
                                            <Label
                                                htmlFor={`level-${level.value}`}
                                            >
                                                {level.label}
                                            </Label>
                                        </div>
                                    ))}
                                </fieldset>
                            )}
                            <fieldset className="space-y-2">
                                <legend className="mb-2 text-sm font-medium">
                                    Salones
                                </legend>
                                {classrooms.map((classroom) => (
                                    <div
                                        key={classroom.value}
                                        className="flex items-center gap-3"
                                    >
                                        <Checkbox
                                            id={`classroom-${classroom.value}`}
                                            checked={data.targets.classroom_ids.includes(
                                                classroom.value,
                                            )}
                                            onCheckedChange={(checked) =>
                                                setTargets({
                                                    classroom_ids: toggle(
                                                        data.targets
                                                            .classroom_ids,
                                                        classroom.value,
                                                        checked === true,
                                                    ),
                                                })
                                            }
                                        />
                                        <Label
                                            htmlFor={`classroom-${classroom.value}`}
                                        >
                                            {classroom.label}
                                        </Label>
                                    </div>
                                ))}
                            </fieldset>
                        </div>
                    )}
                    <InputError message={allErrors.targets} />
                </section>

                <section className="space-y-4">
                    <Heading
                        variant="small"
                        title="Contenido"
                        description="Bloques de texto, imágenes, videos, PDF, actividades y casilla de aceptación."
                    />
                    <BlockEditor
                        blocks={data.blocks}
                        onChange={(blocks) => setData('blocks', blocks)}
                        errors={allErrors}
                        target={target}
                        cloudinaryEnabled={cloudinaryEnabled}
                        types={[
                            'text',
                            'image',
                            'video',
                            'file',
                            'activity',
                            'confirmation',
                        ]}
                    />
                </section>

                <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-2 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
                    <Button variant="ghost" asChild>
                        <Link href={lesson ? show(lesson.id) : index()}>
                            Cancelar
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={processing}
                        onClick={() => submit('draft')}
                    >
                        Guardar borrador
                    </Button>
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={() => submit('published')}
                    >
                        Publicar
                    </Button>
                </div>
            </div>
        </>
    );
}

InductionForm.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Gestionar inducción', href: index() },
        {
            title: props.lesson ? 'Editar lección' : 'Nueva lección',
            href: props.lesson ? show(props.lesson.id) : index(),
        },
    ],
});
