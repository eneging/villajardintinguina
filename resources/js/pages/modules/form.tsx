import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    FileText,
    Film,
    Home,
    ImageIcon,
    Plus,
    Trash2,
    Type,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import LearningModuleController from '@/actions/App/Http/Controllers/LearningModuleController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { BlockRenderer } from '@/components/school/block-renderer';
import { MediaUploader } from '@/components/school/media-uploader';
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
import type {
    BlockContent,
    BlockType,
    LearningModuleDetail,
    MediaItem,
    ModuleStatus,
    Option,
} from '@/types';

type Classroom = { id: number; name: string; level: string; color: string };

type Props = {
    classroom: Classroom;
    module: LearningModuleDetail | null;
    areas: Option[];
    cloudinaryEnabled: boolean;
};

type BlockForm = {
    key: string;
    type: BlockType;
    content: BlockContent;
    media_id: number | null;
    media: MediaItem | null;
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

const blockTypes: { type: BlockType; label: string; icon: ReactNode }[] = [
    { type: 'text', label: 'Texto', icon: <Type /> },
    { type: 'image', label: 'Imagen', icon: <ImageIcon /> },
    { type: 'video', label: 'Video', icon: <Film /> },
    { type: 'file', label: 'PDF', icon: <FileText /> },
    { type: 'activity', label: 'Actividad para casa', icon: <Home /> },
];

const textareaClass =
    'min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

const newKey = () => Math.random().toString(36).slice(2);

export default function ModuleFormPage({
    classroom,
    module,
    areas,
    cloudinaryEnabled,
}: Props) {
    const today = localToday();
    const form = useForm<ModuleForm>({
        title: module?.title ?? '',
        area: module?.area ?? areas[0]?.value ?? '',
        summary: module?.summary ?? '',
        goals: module?.goals.length ? module.goals : [''],
        starts_on: module?.starts_on ?? today,
        ends_on: module?.ends_on ?? today,
        status: module?.status ?? 'draft',
        cover_media_id: module?.cover_media_id ?? null,
        blocks:
            module?.blocks.map((block) => ({
                key: newKey(),
                type: block.type,
                content: block.content,
                media_id: block.media?.id ?? null,
                media: block.media,
            })) ?? [],
    });
    const { data, setData, errors, processing } = form;
    const errorFor = (key: string) =>
        (errors as Record<string, string | undefined>)[key];

    const [cover, setCover] = useState<MediaItem | null>(module?.cover ?? null);

    function updateBlock(index: number, patch: Partial<BlockForm>) {
        setData(
            'blocks',
            data.blocks.map((block, i) =>
                i === index ? { ...block, ...patch } : block,
            ),
        );
    }

    function updateContent(index: number, patch: BlockContent) {
        updateBlock(index, {
            content: { ...data.blocks[index].content, ...patch },
        });
    }

    function moveBlock(index: number, direction: -1 | 1) {
        const blocks = [...data.blocks];
        const target = index + direction;
        [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
        setData('blocks', blocks);
    }

    function submit(status: ModuleStatus) {
        form.transform((values) => ({
            ...values,
            status,
            blocks: values.blocks.map(({ type, content, media_id }) => ({
                type,
                content,
                media_id,
            })),
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

                    <div className="grid gap-2">
                        <Label>Portada</Label>
                        {data.cover_media_id && (
                            <p className="text-sm text-muted-foreground">
                                {cover?.thumbnail ? (
                                    <img
                                        src={cover.thumbnail}
                                        alt=""
                                        className="h-24 rounded-lg"
                                    />
                                ) : (
                                    'Imagen de portada lista.'
                                )}
                            </p>
                        )}
                        <MediaUploader
                            classroomId={classroom.id}
                            resourceType="image"
                            label={
                                data.cover_media_id
                                    ? 'Cambiar portada'
                                    : 'Subir portada'
                            }
                            disabled={!cloudinaryEnabled}
                            onUploaded={(media) => {
                                setCover(media);
                                setData('cover_media_id', media.id);
                            }}
                        />
                    </div>
                </section>

                <section className="space-y-4">
                    <Heading
                        variant="small"
                        title="Contenido"
                        description="Arma el módulo con bloques de texto, imágenes, videos, PDF y actividades para casa."
                    />
                    {!cloudinaryEnabled && (
                        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                            Cloudinary aún no está configurado: por ahora puedes
                            usar texto, actividades y videos de YouTube.
                        </p>
                    )}
                    <InputError message={errorFor('blocks')} />

                    {data.blocks.map((block, index) => (
                        <div
                            key={block.key}
                            className="space-y-3 rounded-2xl border bg-card p-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">
                                    {
                                        blockTypes.find(
                                            (b) => b.type === block.type,
                                        )?.label
                                    }
                                </span>
                                <div className="flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Subir"
                                        disabled={index === 0}
                                        onClick={() => moveBlock(index, -1)}
                                    >
                                        <ArrowUp />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Bajar"
                                        disabled={
                                            index === data.blocks.length - 1
                                        }
                                        onClick={() => moveBlock(index, 1)}
                                    >
                                        <ArrowDown />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Eliminar bloque"
                                        onClick={() =>
                                            setData(
                                                'blocks',
                                                data.blocks.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            </div>

                            {block.type === 'activity' && (
                                <Input
                                    value={block.content.title ?? ''}
                                    onChange={(e) =>
                                        updateContent(index, {
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder="Actividad para casa"
                                />
                            )}

                            {(block.type === 'text' ||
                                block.type === 'activity') && (
                                <textarea
                                    className={textareaClass}
                                    value={block.content.body ?? ''}
                                    onChange={(e) =>
                                        updateContent(index, {
                                            body: e.target.value,
                                        })
                                    }
                                    placeholder={
                                        block.type === 'text'
                                            ? 'Escribe aquí…'
                                            : 'Describe la actividad que pueden hacer en familia'
                                    }
                                />
                            )}

                            {block.type === 'video' && (
                                <Input
                                    value={block.content.youtube_url ?? ''}
                                    onChange={(e) =>
                                        updateContent(index, {
                                            youtube_url: e.target.value,
                                        })
                                    }
                                    placeholder="Enlace de YouTube (opcional si subes el video)"
                                />
                            )}

                            {(block.type === 'image' ||
                                block.type === 'video' ||
                                block.type === 'file') && (
                                <>
                                    <MediaUploader
                                        classroomId={classroom.id}
                                        resourceType={
                                            block.type === 'file'
                                                ? 'raw'
                                                : block.type
                                        }
                                        label={
                                            block.media
                                                ? 'Reemplazar archivo'
                                                : 'Subir archivo'
                                        }
                                        disabled={!cloudinaryEnabled}
                                        onUploaded={(media) =>
                                            updateBlock(index, {
                                                media,
                                                media_id: media.id,
                                            })
                                        }
                                    />
                                    <Input
                                        value={block.content.caption ?? ''}
                                        onChange={(e) =>
                                            updateContent(index, {
                                                caption: e.target.value,
                                            })
                                        }
                                        placeholder="Descripción (opcional)"
                                    />
                                </>
                            )}

                            <InputError message={errorFor(`blocks.${index}`)} />

                            {(block.media || block.content.youtube_url) && (
                                <div className="rounded-xl bg-muted/40 p-3">
                                    <BlockRenderer
                                        block={{
                                            type: block.type,
                                            content: block.content,
                                            media: block.media,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="flex flex-wrap gap-2">
                        {blockTypes.map(({ type, label, icon }) => (
                            <Button
                                key={type}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setData('blocks', [
                                        ...data.blocks,
                                        {
                                            key: newKey(),
                                            type,
                                            content: {},
                                            media_id: null,
                                            media: null,
                                        },
                                    ])
                                }
                            >
                                {icon} {label}
                            </Button>
                        ))}
                    </div>
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
