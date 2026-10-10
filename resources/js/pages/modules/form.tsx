import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import LearningModuleController from '@/actions/App/Http/Controllers/LearningModuleController';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { localToday } from '@/lib/school';
import { show as showClassroom } from '@/routes/classrooms';
import { show as showModule } from '@/routes/modules';
import type { LearningModuleDetail, ModuleStatus, Option } from '@/types';

type Classroom = { id: number; name: string; level: string; color: string };

type Props = {
    classroom: Classroom;
    module: LearningModuleDetail | null;
    areas: Option[];
    cloudinaryEnabled: boolean;
};

type ModuleForm = {
    title: string;
    area: string;
    summary: string;
    goals: string[];
    starts_on: string;
    ends_on: string;
    status: ModuleStatus;
    cover_media_id: number | null;
    blocks: BlockForm[];
};

export default function ModuleFormPage({
    classroom,
    module,
    areas,
    cloudinaryEnabled,
}: Props) {
    const today = localToday();
    const target = {
        context: 'classroom',
        classroom_id: classroom.id,
    } as const;
    const form = useForm<ModuleForm>({
        title: module?.title ?? '',
        area: module?.area ?? areas[0]?.value ?? '',
        summary: module?.summary ?? '',
        goals: module?.goals.length ? module.goals : [''],
        starts_on: module?.starts_on ?? today,
        ends_on: module?.ends_on ?? today,
        status: module?.status ?? 'draft',
        cover_media_id: module?.cover_media_id ?? null,
        blocks: toBlockForms(module?.blocks),
    });
    const { data, setData, errors, processing } = form;

    function submit(status: ModuleStatus) {
        form.transform((values) => ({
            ...values,
            status,
            blocks: toBlockPayload(values.blocks),
        }));

        form.submit(
            module
                ? LearningModuleController.update(module.id)
                : LearningModuleController.store(classroom.id),
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title={module ? 'Editar módulo' : 'Nuevo módulo'} />

            <div className="mx-auto w-full max-w-3xl space-y-8 p-4 pb-24">
                <Heading
                    title={
                        module
                            ? 'Editar módulo de aprendizaje'
                            : 'Nuevo módulo de aprendizaje'
                    }
                    description={`${classroom.name} · ${classroom.level} — cuéntales a los padres qué aprenderán sus hijos.`}
                />

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Conocemos los animales de la granja"
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label>Área</Label>
                            <Select
                                value={data.area}
                                onValueChange={(value) =>
                                    setData('area', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {areas.map((area) => (
                                        <SelectItem
                                            key={area.value}
                                            value={area.value}
                                        >
                                            {area.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.area} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="starts_on">Desde</Label>
                            <Input
                                id="starts_on"
                                type="date"
                                value={data.starts_on}
                                onChange={(e) =>
                                    setData('starts_on', e.target.value)
                                }
                            />
                            <InputError message={errors.starts_on} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="ends_on">Hasta</Label>
                            <Input
                                id="ends_on"
                                type="date"
                                value={data.ends_on}
                                onChange={(e) =>
                                    setData('ends_on', e.target.value)
                                }
                            />
                            <InputError message={errors.ends_on} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="summary">Resumen para los padres</Label>
                        <textarea
                            id="summary"
                            className={textareaClass}
                            value={data.summary}
                            onChange={(e) => setData('summary', e.target.value)}
                            placeholder="Durante estas semanas exploraremos…"
                        />
                        <InputError message={errors.summary} />
                    </div>

                    <div className="grid gap-2">
                        <Label>¿Qué aprenderán?</Label>
                        {data.goals.map((goal, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    value={goal}
                                    onChange={(e) =>
                                        setData(
                                            'goals',
                                            data.goals.map((g, i) =>
                                                i === index
                                                    ? e.target.value
                                                    : g,
                                            ),
                                        )
                                    }
                                    placeholder="Reconoce y nombra 5 animales de la granja"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Quitar logro"
                                    onClick={() =>
                                        setData(
                                            'goals',
                                            data.goals.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                >
                                    <X />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-fit"
                            onClick={() =>
                                setData('goals', [...data.goals, ''])
                            }
                        >
                            <Plus /> Agregar logro
                        </Button>
                    </div>

                    <CoverField
                        target={target}
                        initial={module?.cover ?? null}
                        hasCover={data.cover_media_id !== null}
                        disabled={!cloudinaryEnabled}
                        onChange={(id) => setData('cover_media_id', id)}
                    />
                </section>

                <section className="space-y-4">
                    <Heading
                        variant="small"
                        title="Contenido"
                        description="Arma el módulo con bloques de texto, imágenes, videos, PDF y actividades para casa."
                    />
                    <BlockEditor
                        blocks={data.blocks}
                        onChange={(blocks) => setData('blocks', blocks)}
                        errors={errors as Record<string, string | undefined>}
                        target={target}
                        cloudinaryEnabled={cloudinaryEnabled}
                        types={['text', 'image', 'video', 'file', 'activity']}
                    />
                </section>

                <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-2 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
                    <Button variant="ghost" asChild>
                        <Link
                            href={
                                module
                                    ? showModule(module.id)
                                    : showClassroom(classroom.id)
                            }
                        >
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
                        Publicar para los padres
                    </Button>
                </div>
            </div>
        </>
    );
}

ModuleFormPage.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: props.classroom.name,
            href: showClassroom(props.classroom.id),
        },
        {
            title: props.module ? 'Editar módulo' : 'Nuevo módulo',
            href: props.module
                ? showModule(props.module.id)
                : showClassroom(props.classroom.id),
        },
    ],
});
