import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EventController from '@/actions/App/Http/Controllers/Admin/EventController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { textareaClass } from '@/components/school/block-editor';
import { MediaUploader } from '@/components/school/media-uploader';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/events';
import type { EventTheme, FormField, MediaItem } from '@/types';

type Preset = EventTheme & { key: string; name: string };

type Props = {
    event: {
        id: number;
        title: string;
        description: string | null;
        date: string;
        theme: EventTheme;
        banner_media_id: number | null;
        banner: MediaItem | null;
        form_schema: FormField[];
        per_student: boolean;
        registration_open: boolean;
        published: boolean;
    } | null;
    themes: Preset[];
    cloudinaryEnabled: boolean;
};

const fieldTypes = [
    { value: 'text', label: 'Texto corto' },
    { value: 'textarea', label: 'Texto largo' },
    { value: 'number', label: 'Número' },
    { value: 'select', label: 'Lista de opciones' },
    { value: 'checkbox', label: 'Casilla (sí/no)' },
];

export default function EventForm({ event, themes, cloudinaryEnabled }: Props) {
    const [banner, setBanner] = useState<MediaItem | null>(
        event?.banner ?? null,
    );
    const form = useForm({
        title: event?.title ?? '',
        description: event?.description ?? '',
        date: event?.date ?? '',
        theme: event?.theme ?? {
            color: themes[0].color,
            accent: themes[0].accent,
            emoji: themes[0].emoji,
        },
        banner_media_id: event?.banner_media_id ?? null,
        form_schema: event?.form_schema ?? ([] as FormField[]),
        per_student: event?.per_student ?? true,
        registration_open: event?.registration_open ?? true,
        published: event?.published ?? false,
    });
    const { data, setData, errors, processing } = form;
    const allErrors = errors as Record<string, string | undefined>;

    function updateField(i: number, patch: Partial<FormField>) {
        setData(
            'form_schema',
            data.form_schema.map((f, index) =>
                index === i ? { ...f, ...patch } : f,
            ),
        );
    }

    function moveField(i: number, direction: -1 | 1) {
        const fields = [...data.form_schema];
        [fields[i], fields[i + direction]] = [fields[i + direction], fields[i]];
        setData('form_schema', fields);
    }

    return (
        <>
            <Head title={event ? 'Editar evento' : 'Nuevo evento'} />
            <form
                className="mx-auto w-full max-w-3xl space-y-6 p-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.submit(
                        event
                            ? EventController.update(event.id)
                            : EventController.store(),
                    );
                }}
            >
                <Heading
                    title={event ? 'Editar evento' : 'Nuevo evento'}
                    description="Elige un tema festivo, cuéntales a las familias de qué se trata y arma el formulario."
                />

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <Label>Tema</Label>
                    <div className="flex flex-wrap gap-2">
                        {themes.map((theme) => (
                            <button
                                key={theme.key}
                                type="button"
                                onClick={() => {
                                    setData('theme', {
                                        color: theme.color,
                                        accent: theme.accent,
                                        emoji: theme.emoji,
                                    });
                                    if (!data.title) {
                                        setData((values) => ({
                                            ...values,
                                            title: theme.name,
                                            theme: {
                                                color: theme.color,
                                                accent: theme.accent,
                                                emoji: theme.emoji,
                                            },
                                        }));
                                    }
                                }}
                                className="flex items-center gap-1 rounded-full border-2 px-3 py-1 text-sm font-medium"
                                style={{
                                    backgroundColor: theme.accent,
                                    color: theme.color,
                                    borderColor:
                                        data.theme.color === theme.color
                                            ? theme.color
                                            : 'transparent',
                                }}
                            >
                                {theme.emoji} {theme.name}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <label className="flex items-center gap-2">
                            Color{' '}
                            <input
                                type="color"
                                value={data.theme.color}
                                onChange={(e) =>
                                    setData('theme', {
                                        ...data.theme,
                                        color: e.target.value,
                                    })
                                }
                                className="size-8 rounded"
                            />
                        </label>
                        <label className="flex items-center gap-2">
                            Fondo{' '}
                            <input
                                type="color"
                                value={data.theme.accent}
                                onChange={(e) =>
                                    setData('theme', {
                                        ...data.theme,
                                        accent: e.target.value,
                                    })
                                }
                                className="size-8 rounded"
                            />
                        </label>
                        <label className="flex items-center gap-2">
                            Emoji{' '}
                            <Input
                                className="w-16 text-center"
                                value={data.theme.emoji ?? ''}
                                onChange={(e) =>
                                    setData('theme', {
                                        ...data.theme,
                                        emoji: e.target.value,
                                    })
                                }
                            />
                        </label>
                    </div>
                    <div
                        className="rounded-2xl p-6 text-center"
                        style={{ backgroundColor: data.theme.accent }}
                    >
                        <span className="text-5xl">{data.theme.emoji}</span>
                        <p
                            className="mt-2 font-display text-2xl font-bold"
                            style={{ color: data.theme.color }}
                        >
                            {data.title || 'Título del evento'}
                        </p>
                    </div>
                </section>

                <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-[1fr_12rem]">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        <InputError message={errors.title} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input
                            id="date"
                            type="date"
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                        />
                        <InputError message={errors.date} />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="description">
                            Descripción para las familias
                        </Label>
                        <textarea
                            id="description"
                            className={textareaClass}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label>Imagen de portada</Label>
                        {banner?.thumbnail && (
                            <img
                                src={banner.thumbnail}
                                alt=""
                                className="h-28 w-fit rounded-lg"
                            />
                        )}
                        <MediaUploader
                            target={{ context: 'event' }}
                            resourceType="image"
                            label={banner ? 'Cambiar imagen' : 'Subir imagen'}
                            disabled={!cloudinaryEnabled}
                            onUploaded={(media) => {
                                setBanner(media);
                                setData('banner_media_id', media.id);
                            }}
                        />
                    </div>
                </section>

                <section className="space-y-3 rounded-2xl border bg-card p-5">
                    <Heading
                        variant="small"
                        title="Formulario para las familias"
                        description="Inscripción, confirmación de asistencia, tallas de disfraz, autorización de fotos…"
                    />
                    {data.form_schema.map((field, i) => (
                        <div
                            key={i}
                            className="space-y-2 rounded-xl border p-3"
                        >
                            <div className="grid gap-2 sm:grid-cols-[1fr_11rem_auto]">
                                <Input
                                    value={field.label}
                                    placeholder="Pregunta"
                                    onChange={(e) =>
                                        updateField(i, {
                                            label: e.target.value,
                                        })
                                    }
                                />
                                <NativeSelect
                                    value={field.type}
                                    options={fieldTypes}
                                    onChange={(e) =>
                                        updateField(i, {
                                            type: e.target
                                                .value as FormField['type'],
                                        })
                                    }
                                />
                                <div className="flex">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Subir"
                                        disabled={i === 0}
                                        onClick={() => moveField(i, -1)}
                                    >
                                        <ArrowUp />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Bajar"
                                        disabled={
                                            i === data.form_schema.length - 1
                                        }
                                        onClick={() => moveField(i, 1)}
                                    >
                                        <ArrowDown />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Quitar"
                                        onClick={() =>
                                            setData(
                                                'form_schema',
                                                data.form_schema.filter(
                                                    (_, idx) => idx !== i,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            </div>
                            {field.type === 'select' && (
                                <Input
                                    placeholder="Opciones separadas por coma: S, M, L"
                                    value={field.options.join(', ')}
                                    onChange={(e) =>
                                        updateField(i, {
                                            options: e.target.value
                                                .split(',')
                                                .map((o) => o.trimStart()),
                                        })
                                    }
                                />
                            )}
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={field.required}
                                    onCheckedChange={(c) =>
                                        updateField(i, { required: c === true })
                                    }
                                />{' '}
                                Obligatoria
                            </label>
                            <InputError
                                message={
                                    allErrors[`form_schema.${i}.label`] ??
                                    allErrors[`form_schema.${i}.options`]
                                }
                            />
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setData('form_schema', [
                                ...data.form_schema,
                                {
                                    label: '',
                                    type: 'text',
                                    required: false,
                                    options: [],
                                },
                            ])
                        }
                    >
                        <Plus /> Agregar pregunta
                    </Button>
                    <div className="grid gap-2 border-t pt-3 text-sm">
                        <label className="flex items-center gap-2">
                            <Checkbox
                                checked={data.per_student}
                                onCheckedChange={(c) =>
                                    setData('per_student', c === true)
                                }
                            />{' '}
                            Una respuesta por cada hijo (si no, una por familia)
                        </label>
                        <label className="flex items-center gap-2">
                            <Checkbox
                                checked={data.registration_open}
                                onCheckedChange={(c) =>
                                    setData('registration_open', c === true)
                                }
                            />{' '}
                            Inscripciones abiertas
                        </label>
                        <label className="flex items-center gap-2">
                            <Checkbox
                                checked={data.published}
                                onCheckedChange={(c) =>
                                    setData('published', c === true)
                                }
                            />{' '}
                            Publicado (visible para las familias)
                        </label>
                    </div>
                </section>

                <InputError
                    message={(errors as Record<string, string>).event}
                />
                <div className="flex flex-wrap justify-end gap-2">
                    {event && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="mr-auto text-destructive"
                            onClick={() =>
                                confirm(
                                    '¿Eliminar el evento con sus respuestas y sorteos sin vender? No se puede deshacer.',
                                ) &&
                                router.delete(
                                    EventController.destroy.url(event.id),
                                )
                            }
                        >
                            <Trash2 /> Eliminar evento
                        </Button>
                    )}
                    <Button variant="ghost" asChild>
                        <Link href={index()}>Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        Guardar evento
                    </Button>
                </div>
            </form>
        </>
    );
}

EventForm.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Eventos y sorteos', href: index() },
        { title: props.event?.title ?? 'Nuevo evento', href: index() },
    ],
});
