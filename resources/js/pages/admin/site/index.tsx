import { Head, Link, router } from '@inertiajs/react';
import type { RequestPayload } from '@inertiajs/core';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { MediaUploader } from '@/components/school/media-uploader';
import { SiteIcon } from '@/components/school/site-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { index as leads } from '@/routes/admin/leads';
import { index, update } from '@/routes/admin/site';
import type { MediaItem, SiteSections } from '@/types';

type Props = {
    sections: SiteSections;
    icons: string[];
    newLeads: number;
    cloudinaryEnabled: boolean;
};

type Errors = Record<string, string>;
type Setter<T> = <K extends keyof T>(key: K, value: T[K]) => void;

const tabs = [
    { key: 'hero', label: 'Portada' },
    { key: 'about', label: 'Nosotros' },
    { key: 'levels', label: 'Niveles' },
    { key: 'services', label: 'Servicios' },
    { key: 'schedule', label: 'Horarios' },
    { key: 'team', label: 'Equipo' },
    { key: 'testimonials', label: 'Testimonios' },
    { key: 'contact', label: 'Contacto y redes' },
    { key: 'admission', label: 'Admisión' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const textareaClass =
    'min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

/** Quita los archivos ya resueltos (`image`, `photo`…) antes de enviar. */
function withoutMedia(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(withoutMedia);
    }

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;

        return Object.fromEntries(
            Object.entries(record)
                .filter(([key]) => !(`${key}_media_id` in record))
                .map(([key, inner]) => [key, withoutMedia(inner)]),
        );
    }

    return value;
}

function SectionForm<T extends object>({
    section,
    initial,
    children,
}: {
    section: TabKey;
    initial: T;
    children: (data: T, set: Setter<T>, errors: Errors) => ReactNode;
}) {
    const [data, setData] = useState<T>(initial);
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);
    const set: Setter<T> = (key, value) =>
        setData((current) => ({ ...current, [key]: value }));

    return (
        <form
            className="space-y-5"
            onSubmit={(event) => {
                event.preventDefault();
                router.put(
                    update(section).url,
                    withoutMedia(data) as RequestPayload,
                    {
                        preserveScroll: true,
                        onStart: () => setProcessing(true),
                        onFinish: () => setProcessing(false),
                        onSuccess: () => setErrors({}),
                        onError: (bag) => setErrors(bag),
                    },
                );
            }}
        >
            {children(data, set, errors)}
            {Object.keys(errors).length > 0 && (
                <p className="text-sm text-destructive">
                    Revisa los campos marcados.
                </p>
            )}
            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    Guardar sección
                </Button>
            </div>
        </form>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
    type = 'text',
    placeholder,
    className,
}: {
    label: string;
    value: string | null;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={cn('grid gap-2', className)}>
            <Label>{label}</Label>
            <Input
                type={type}
                value={value ?? ''}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}

function Area({
    label,
    value,
    onChange,
    error,
    className,
}: {
    label: string;
    value: string | null;
    onChange: (value: string) => void;
    error?: string;
    className?: string;
}) {
    return (
        <div className={cn('grid gap-2', className)}>
            <Label>{label}</Label>
            <textarea
                className={textareaClass}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}

function ImageField({
    label,
    media,
    resourceType = 'image',
    disabled,
    onChange,
}: {
    label: string;
    media: MediaItem | null | undefined;
    resourceType?: 'image' | 'video';
    disabled: boolean;
    onChange: (media: MediaItem | null) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {media?.thumbnail && (
                <img
                    src={media.thumbnail}
                    alt=""
                    className="h-28 w-fit rounded-xl object-cover"
                />
            )}
            <div className="flex flex-wrap gap-2">
                <MediaUploader
                    target={{ context: 'site' }}
                    resourceType={resourceType}
                    label={media ? 'Cambiar' : 'Subir'}
                    disabled={disabled}
                    onUploaded={onChange}
                />
                {media && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange(null)}
                    >
                        Quitar
                    </Button>
                )}
            </div>
        </div>
    );
}

/** Lista ordenable de elementos (servicios, testimonios, equipo…). */
function ListEditor<T>({
    items,
    onChange,
    blank,
    addLabel,
    children,
}: {
    items: T[];
    onChange: (items: T[]) => void;
    blank: T;
    addLabel: string;
    children: (
        item: T,
        change: (patch: Partial<T>) => void,
        index: number,
    ) => ReactNode;
}) {
    const move = (from: number, to: number) => {
        const next = [...items];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        onChange(next);
    };

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div
                    key={index}
                    className="relative rounded-xl border bg-background p-4 pr-12"
                >
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Subir"
                            disabled={index === 0}
                            onClick={() => move(index, index - 1)}
                        >
                            <ArrowUp />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Bajar"
                            disabled={index === items.length - 1}
                            onClick={() => move(index, index + 1)}
                        >
                            <ArrowDown />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive"
                            aria-label="Quitar"
                            onClick={() =>
                                onChange(items.filter((_, i) => i !== index))
                            }
                        >
                            <Trash2 />
                        </Button>
                    </div>
                    {children(
                        item,
                        (patch) =>
                            onChange(
                                items.map((current, i) =>
                                    i === index
                                        ? { ...current, ...patch }
                                        : current,
                                ),
                            ),
                        index,
                    )}
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([...items, blank])}
            >
                <Plus /> {addLabel}
            </Button>
        </div>
    );
}

function StringList({
    label,
    items,
    onChange,
    addLabel,
}: {
    label: string;
    items: string[];
    onChange: (items: string[]) => void;
    addLabel: string;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                    <Input
                        value={item}
                        onChange={(e) =>
                            onChange(
                                items.map((current, i) =>
                                    i === index ? e.target.value : current,
                                ),
                            )
                        }
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Quitar"
                        onClick={() =>
                            onChange(items.filter((_, i) => i !== index))
                        }
                    >
                        <Trash2 />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => onChange([...items, ''])}
            >
                <Plus /> {addLabel}
            </Button>
        </div>
    );
}

function IconPicker({
    icons,
    value,
    onChange,
}: {
    icons: string[];
    value: string;
    onChange: (icon: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-1">
            {icons.map((icon) => (
                <button
                    key={icon}
                    type="button"
                    aria-label={icon}
                    aria-pressed={value === icon}
                    onClick={() => onChange(icon)}
                    className={cn(
                        'flex size-8 items-center justify-center rounded-lg border transition',
                        value === icon
                            ? 'border-green-600 bg-green-100 text-green-700'
                            : 'hover:bg-muted',
                    )}
                >
                    <SiteIcon name={icon} className="size-4" />
                </button>
            ))}
        </div>
    );
}

function initialTab(): TabKey {
    if (typeof window === 'undefined') {
        return 'hero';
    }

    const hash = window.location.hash.slice(1);

    return tabs.some((tab) => tab.key === hash) ? (hash as TabKey) : 'hero';
}

export default function SiteEditor({
    sections,
    icons,
    newLeads,
    cloudinaryEnabled,
}: Props) {
    const [tab, setTab] = useState<TabKey>(initialTab);
    const noUploads = !cloudinaryEnabled;

    return (
        <>
            <Head title="Sitio web" />
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Sitio web"
                        description="Edita los textos, fotos y datos que ven las familias en la página pública."
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={leads()}>
                                Admisiones
                                {newLeads > 0 && (
                                    <Badge className="ml-1">{newLeads}</Badge>
                                )}
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <a
                                href={home().url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink /> Ver sitio
                            </a>
                        </Button>
                    </div>
                </div>

                {noUploads && (
                    <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        Configura Cloudinary para subir fotos y videos del
                        sitio.
                    </p>
                )}

                <div
                    role="tablist"
                    className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1"
                >
                    {tabs.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={tab === item.key}
                            onClick={() => {
                                setTab(item.key);
                                window.history.replaceState(
                                    null,
                                    '',
                                    `#${item.key}`,
                                );
                            }}
                            className={cn(
                                'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition',
                                tab === item.key
                                    ? 'bg-background shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <section className="rounded-2xl border bg-card p-5">
                    {tab === 'hero' && (
                        <SectionForm section="hero" initial={sections.hero}>
                            {(data, set, errors) => (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label="Etiqueta superior"
                                        value={data.badge}
                                        onChange={(v) => set('badge', v)}
                                        error={errors.badge}
                                        placeholder="Matrículas abiertas"
                                    />
                                    <Field
                                        label="Título"
                                        value={data.title}
                                        onChange={(v) => set('title', v)}
                                        error={errors.title}
                                    />
                                    <Field
                                        label="Palabra destacada (en verde)"
                                        value={data.highlight}
                                        onChange={(v) => set('highlight', v)}
                                    />
                                    <Field
                                        label="Final del título"
                                        value={data.title_end}
                                        onChange={(v) => set('title_end', v)}
                                    />
                                    <Area
                                        label="Subtítulo"
                                        value={data.subtitle}
                                        onChange={(v) => set('subtitle', v)}
                                        error={errors.subtitle}
                                        className="sm:col-span-2"
                                    />
                                    <ImageField
                                        label="Foto principal"
                                        media={data.image}
                                        disabled={noUploads}
                                        onChange={(media) => {
                                            set('image', media);
                                            set(
                                                'image_media_id',
                                                media?.id ?? null,
                                            );
                                        }}
                                    />
                                    <ImageField
                                        label="Video corto en bucle (reemplaza la foto)"
                                        media={data.video}
                                        resourceType="video"
                                        disabled={noUploads}
                                        onChange={(media) => {
                                            set('video', media);
                                            set(
                                                'video_media_id',
                                                media?.id ?? null,
                                            );
                                        }}
                                    />
                                    <Field
                                        label="Video de presentación en YouTube (opcional)"
                                        value={data.video_url}
                                        onChange={(v) => set('video_url', v)}
                                        error={errors.video_url}
                                        placeholder="https://youtu.be/…"
                                        className="sm:col-span-2"
                                    />
                                </div>
                            )}
                        </SectionForm>
                    )}

                    {tab === 'about' && (
                        <SectionForm section="about" initial={sections.about}>
                            {(data, set, errors) => (
                                <div className="grid gap-4">
                                    <Field
                                        label="Título"
                                        value={data.title}
                                        onChange={(v) => set('title', v)}
                                        error={errors.title}
                                    />
                                    <Area
                                        label="Presentación"
                                        value={data.intro}
                                        onChange={(v) => set('intro', v)}
                                    />
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Area
                                            label="Misión"
                                            value={data.mission}
                                            onChange={(v) => set('mission', v)}
                                        />
                                        <Area
                                            label="Visión"
                                            value={data.vision}
                                            onChange={(v) => set('vision', v)}
                                        />
                                    </div>
                                    <StringList
                                        label="Valores"
                                        items={data.values}
                                        onChange={(v) => set('values', v)}
                                        addLabel="Agregar valor"
                                    />
                                    <Field
                                        label="Título de la propuesta pedagógica"
                                        value={data.proposal_title}
                                        onChange={(v) =>
                                            set('proposal_title', v)
                                        }
                                    />
                                    <Area
                                        label="Propuesta pedagógica"
                                        value={data.proposal}
                                        onChange={(v) => set('proposal', v)}
                                    />
                                    <ImageField
                                        label="Foto"
                                        media={data.image}
                                        disabled={noUploads}
                                        onChange={(media) => {
                                            set('image', media);
                                            set(
                                                'image_media_id',
                                                media?.id ?? null,
                                            );
                                        }}
                                    />
                                    <Label>Pilares</Label>
                                    <ListEditor
                                        items={data.pillars}
                                        onChange={(v) => set('pillars', v)}
                                        blank={{
                                            icon: 'star',
                                            title: '',
                                            text: '',
                                        }}
                                        addLabel="Agregar pilar"
                                    >
                                        {(item, change) => (
                                            <div className="grid gap-3">
                                                <IconPicker
                                                    icons={icons}
                                                    value={item.icon}
                                                    onChange={(icon) =>
                                                        change({ icon })
                                                    }
                                                />
                                                <Input
                                                    value={item.title}
                                                    placeholder="Título"
                                                    onChange={(e) =>
                                                        change({
                                                            title: e.target
                                                                .value,
                                                        })
                                                    }
                                                />
                                                <Input
                                                    value={item.text ?? ''}
                                                    placeholder="Descripción"
                                                    onChange={(e) =>
                                                        change({
                                                            text: e.target
                                                                .value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        )}
                                    </ListEditor>
                                </div>
                            )}
                        </SectionForm>
                    )}

                    {tab === 'levels' && (
                        <SectionForm section="levels" initial={sections.levels}>
                            {(data, set) => (
                                <ListEditor
                                    items={data.items}
                                    onChange={(v) => set('items', v)}
                                    blank={{
                                        name: '',
                                        age: '',
                                        mascot: '🌟',
                                        color: '#16a34a',
                                        text: '',
                                    }}
                                    addLabel="Agregar nivel"
                                >
                                    {(item, change) => (
                                        <div className="grid gap-3 sm:grid-cols-[4rem_1fr_1fr_4rem]">
                                            <Input
                                                aria-label="Mascota"
                                                value={item.mascot ?? ''}
                                                className="text-center text-xl"
                                                onChange={(e) =>
                                                    change({
                                                        mascot: e.target.value,
                                                    })
                                                }
                                            />
                                            <Input
                                                value={item.name}
                                                placeholder="Nivel"
                                                onChange={(e) =>
                                                    change({
                                                        name: e.target.value,
                                                    })
                                                }
                                            />
                                            <Input
                                                value={item.age ?? ''}
                                                placeholder="Edad o salón"
                                                onChange={(e) =>
                                                    change({
                                                        age: e.target.value,
                                                    })
                                                }
                                            />
                                            <Input
                                                type="color"
                                                aria-label="Color"
                                                value={item.color}
                                                onChange={(e) =>
                                                    change({
                                                        color: e.target.value,
                                                    })
                                                }
                                            />
                                            <Input
                                                value={item.text ?? ''}
                                                placeholder="Descripción"
                                                className="sm:col-span-4"
                                                onChange={(e) =>
                                                    change({
                                                        text: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    )}
                                </ListEditor>
                            )}
                        </SectionForm>
                    )}

                    {tab === 'services' && (
                        <SectionForm
                            section="services"
                            initial={sections.services}
                        >
                            {(data, set) => (
                                <ListEditor
                                    items={data.items}
                                    onChange={(v) => set('items', v)}
                                    blank={{
                                        icon: 'star',
                                        title: '',
                                        text: '',
                                    }}
                                    addLabel="Agregar servicio"
                                >
                                    {(item, change) => (
                                        <div className="grid gap-3">
                                            <IconPicker
                                                icons={icons}
                                                value={item.icon}
                                                onChange={(icon) =>
                                                    change({ icon })
                                                }
                                            />
                                            <Input
                                                value={item.title}
                                                placeholder="Servicio"
                                                onChange={(e) =>
                                                    change({
                                                        title: e.target.value,
                                                    })
                                                }
                                            />
                                            <textarea
                                                className={textareaClass}
                                                value={item.text ?? ''}
                                                placeholder="Descripción"
                                                onChange={(e) =>
                                                    change({
                                                        text: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    )}
                                </ListEditor>
                            )}
                        </SectionForm>
                    )}

                    {tab === 'schedule' && (
                        <SectionForm
                            section="schedule"
                            initial={sections.schedule}
                        >
                            {(data, set) => (
                                <ListEditor
                                    items={data.items}
                                    onChange={(v) => set('items', v)}
                                    blank={{ label: '', hours: '' }}
                                    addLabel="Agregar horario"
                                >
                                    {(item, change) => (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <Input
                                                value={item.label}
                                                placeholder="Guardería"
                                                onChange={(e) =>
                                                    change({
                                                        label: e.target.value,
                                                    })
                                                }
                                            />
                                            <Input
                                                value={item.hours}
                                                placeholder="Lunes a viernes · 7:30 – 17:00"
                                                onChange={(e) =>
                                                    change({
                                                        hours: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    )}
                                </ListEditor>
                            )}
                        </SectionForm>
                    )}

                    {tab === 'team' && (
                        <SectionForm section="team" initial={sections.team}>
                            {(data, set) => (
                                <div className="grid gap-4">
                                    <Field
                                        label="Frase de presentación"
                                        value={data.intro}
                                        onChange={(v) => set('intro', v)}
                                    />
                                    <ListEditor
                                        items={data.items}
                                        onChange={(v) => set('items', v)}
                                        blank={{
                                            name: '',
                                            role: '',
                                            bio: '',
                                            photo_media_id: null,
                                            photo: null,
                                        }}
                                        addLabel="Agregar persona"
                                    >
                                        {(item, change) => (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Input
                                                    value={item.name}
                                                    placeholder="Nombre"
                                                    onChange={(e) =>
                                                        change({
                                                            name: e.target
                                                                .value,
                                                        })
                                                    }
                                                />
                                                <Input
                                                    value={item.role ?? ''}
                                                    placeholder="Maestra de 4 años"
                                                    onChange={(e) =>
                                                        change({
                                                            role: e.target
                                                                .value,
                                                        })
                                                    }
                                                />
                                                <Input
                                                    value={item.bio ?? ''}
                                                    placeholder="Breve presentación"
                                                    className="sm:col-span-2"
                                                    onChange={(e) =>
                                                        change({
                                                            bio: e.target.value,
                                                        })
                                                    }
                                                />
                                                <ImageField
                                                    label="Foto"
                                                    media={item.photo}
                                                    disabled={noUploads}
                                                    onChange={(media) =>
                                                        change({
                                                            photo: media,
                                                            photo_media_id:
                                                                media?.id ??
                                                                null,
                                                        })
                                                    }
                                                />
                                            </div>
                                        )}
                                    </ListEditor>
                                </div>
                            )}
                        </SectionForm>
                    )}

                    {tab === 'testimonials' && (
                        <SectionForm
                            section="testimonials"
                            initial={sections.testimonials}
                        >
                            {(data, set) => (
                                <ListEditor
                                    items={data.items}
                                    onChange={(v) => set('items', v)}
                                    blank={{ name: '', relation: '', text: '' }}
                                    addLabel="Agregar testimonio"
                                >
                                    {(item, change) => (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <Input
                                                value={item.name}
                                                placeholder="Mamá de Sofía"
                                                onChange={(e) =>
                                                    change({
                                                        name: e.target.value,
                                                    })
                                                }
                                            />
                                            <Input
                                                value={item.relation ?? ''}
                                                placeholder="Salón Patitos"
                                                onChange={(e) =>
                                                    change({
                                                        relation:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                            <textarea
                                                className={cn(
                                                    textareaClass,
                                                    'sm:col-span-2',
                                                )}
                                                value={item.text}
                                                placeholder="Testimonio"
                                                onChange={(e) =>
                                                    change({
                                                        text: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    )}
                                </ListEditor>
                            )}
                        </SectionForm>
                    )}

                    {tab === 'contact' && (
                        <SectionForm
                            section="contact"
                            initial={sections.contact}
                        >
                            {(data, set, errors) => (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label="Teléfono"
                                        value={data.phone}
                                        onChange={(v) => set('phone', v)}
                                    />
                                    <Field
                                        label="Correo"
                                        type="email"
                                        value={data.email}
                                        onChange={(v) => set('email', v)}
                                        error={errors.email}
                                    />
                                    <Field
                                        label="Dirección"
                                        value={data.address}
                                        onChange={(v) => set('address', v)}
                                        className="sm:col-span-2"
                                    />
                                    <Field
                                        label="Horario de atención"
                                        value={data.hours}
                                        onChange={(v) => set('hours', v)}
                                    />
                                    <Field
                                        label="Búsqueda en Google Maps"
                                        value={data.map_query}
                                        onChange={(v) => set('map_query', v)}
                                        placeholder="Av. … 123, Ica"
                                    />
                                    {(
                                        [
                                            'facebook',
                                            'instagram',
                                            'tiktok',
                                            'youtube',
                                        ] as const
                                    ).map((network) => (
                                        <Field
                                            key={network}
                                            label={`Enlace de ${network[0].toUpperCase()}${network.slice(1)}`}
                                            type="url"
                                            value={data[network]}
                                            onChange={(v) => set(network, v)}
                                            error={errors[network]}
                                            placeholder="https://…"
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionForm>
                    )}

                    {tab === 'admission' && (
                        <SectionForm
                            section="admission"
                            initial={sections.admission}
                        >
                            {(data, set, errors) => (
                                <div className="grid gap-4">
                                    <label className="flex items-center gap-3 text-sm">
                                        <Checkbox
                                            checked={data.open}
                                            onCheckedChange={(checked) =>
                                                set('open', checked === true)
                                            }
                                        />
                                        Recibir solicitudes de admisión
                                        (vacantes disponibles)
                                    </label>
                                    <Field
                                        label="Título"
                                        value={data.title}
                                        onChange={(v) => set('title', v)}
                                        error={errors.title}
                                    />
                                    <Area
                                        label="Texto"
                                        value={data.text}
                                        onChange={(v) => set('text', v)}
                                    />
                                    <StringList
                                        label="Pasos del proceso"
                                        items={data.steps}
                                        onChange={(v) => set('steps', v)}
                                        addLabel="Agregar paso"
                                    />
                                    <StringList
                                        label="Requisitos"
                                        items={data.requirements}
                                        onChange={(v) => set('requirements', v)}
                                        addLabel="Agregar requisito"
                                    />
                                </div>
                            )}
                        </SectionForm>
                    )}
                </section>
                <p className="text-xs text-muted-foreground">
                    Cada sección se guarda por separado y los cambios se ven de
                    inmediato en el sitio.
                </p>
            </div>
        </>
    );
}

SiteEditor.layout = {
    breadcrumbs: [{ title: 'Sitio web', href: index() }],
};
