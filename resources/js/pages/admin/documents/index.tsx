import { Head, router, useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import DocumentController from '@/actions/App/Http/Controllers/Admin/DocumentController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { DocumentList } from '@/components/school/document-list';
import type { DocumentRow } from '@/components/school/document-list';
import { MediaUploader } from '@/components/school/media-uploader';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { destroy, index } from '@/routes/admin/documents';
import type { MediaItem } from '@/types';

type OwnerType = 'institution' | 'student' | 'employee';
type NumberOption = { value: number; label: string };

type Props = {
    documents: DocumentRow[];
    filters: { owner_type: string; expiring: boolean; search: string };
    categories: Record<OwnerType, string[]>;
    students: NumberOption[];
    employees: NumberOption[];
    cloudinaryEnabled: boolean;
};

const ownerOptions = [
    { value: 'institution', label: 'Del colegio' },
    { value: 'student', label: 'De un alumno' },
    { value: 'employee', label: 'De un trabajador' },
];

const visibilityOptions: Record<OwnerType, { value: string; label: string }[]> =
    {
        institution: [
            { value: 'all', label: 'Todos (familias y personal)' },
            { value: 'families', label: 'Solo familias' },
            { value: 'staff', label: 'Solo personal' },
        ],
        student: [
            { value: 'private', label: 'Solo administración' },
            { value: 'shared', label: 'Compartir con su familia' },
        ],
        employee: [
            { value: 'private', label: 'Solo administración' },
            { value: 'shared', label: 'Compartir con el trabajador' },
        ],
    };

export default function DocumentsAdmin({
    documents,
    filters,
    categories,
    students,
    employees,
    cloudinaryEnabled,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [file, setFile] = useState<MediaItem | null>(null);
    const [editing, setEditing] = useState<DocumentRow | null>(null);
    const form = useForm({
        owner_type: 'institution' as OwnerType,
        owner_id: '' as number | '',
        category: categories.institution[0],
        title: '',
        media_id: null as number | null,
        expires_on: '',
        visibility: 'all',
    });
    const { data, setData, errors } = form;

    function apply(next: Partial<Props['filters']>) {
        router.get(
            index.url(),
            { ...filters, search, ...next },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Documentos" />
            <div className="space-y-6 p-4">
                <Heading
                    title="Documentos"
                    description="Del colegio, de los alumnos y del personal. Se abren con un enlace que vence en minutos."
                />

                <form
                    className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.transform((values) => ({
                            ...values,
                            owner_id:
                                values.owner_id === '' ? null : values.owner_id,
                            expires_on: values.expires_on || null,
                        }));
                        form.submit(DocumentController.store(), {
                            preserveScroll: true,
                            onSuccess: () => {
                                form.reset('title', 'media_id', 'expires_on');
                                setFile(null);
                            },
                        });
                    }}
                >
                    <h2 className="font-semibold sm:col-span-3">
                        Subir documento
                    </h2>
                    <div className="grid gap-1">
                        <Label htmlFor="owner_type">Pertenece a</Label>
                        <NativeSelect
                            id="owner_type"
                            value={data.owner_type}
                            options={ownerOptions}
                            onChange={(e) => {
                                const type = e.target.value as OwnerType;
                                setData({
                                    ...data,
                                    owner_type: type,
                                    owner_id: '',
                                    category: categories[type][0],
                                    visibility:
                                        visibilityOptions[type][0].value,
                                });
                            }}
                        />
                    </div>
                    {data.owner_type !== 'institution' && (
                        <div className="grid gap-1">
                            <Label htmlFor="owner_id">
                                {data.owner_type === 'student'
                                    ? 'Alumno'
                                    : 'Trabajador'}
                            </Label>
                            <NativeSelect
                                id="owner_id"
                                value={data.owner_id}
                                placeholder="Elige…"
                                options={
                                    data.owner_type === 'student'
                                        ? students
                                        : employees
                                }
                                onChange={(e) =>
                                    setData(
                                        'owner_id',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : '',
                                    )
                                }
                            />
                            <InputError message={errors.owner_id} />
                        </div>
                    )}
                    <div className="grid gap-1">
                        <Label htmlFor="category">Tipo</Label>
                        <NativeSelect
                            id="category"
                            value={data.category}
                            options={categories[data.owner_type].map((c) => ({
                                value: c,
                                label: c,
                            }))}
                            onChange={(e) =>
                                setData('category', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="doc_title">Título</Label>
                        <Input
                            id="doc_title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        <InputError message={errors.title} />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="expires_on">Vence (opcional)</Label>
                        <Input
                            id="expires_on"
                            type="date"
                            value={data.expires_on}
                            onChange={(e) =>
                                setData('expires_on', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="visibility">Quién lo ve</Label>
                        <NativeSelect
                            id="visibility"
                            value={data.visibility}
                            options={visibilityOptions[data.owner_type]}
                            onChange={(e) =>
                                setData('visibility', e.target.value)
                            }
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
                        <MediaUploader
                            target={{ context: 'document' }}
                            resourceType="image"
                            label={
                                file
                                    ? `✓ ${file.original_filename ?? 'Archivo listo'}`
                                    : 'Subir PDF o foto'
                            }
                            disabled={!cloudinaryEnabled}
                            onUploaded={(media) => {
                                setFile(media);
                                setData('media_id', media.id);
                            }}
                        />
                        <InputError message={errors.media_id} />
                        <Button
                            type="submit"
                            className="ml-auto"
                            disabled={form.processing}
                        >
                            Guardar documento
                        </Button>
                    </div>
                </form>

                <form
                    className="flex flex-wrap items-center gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        apply({});
                    }}
                >
                    <NativeSelect
                        className="w-48"
                        value={filters.owner_type}
                        placeholder="Todos"
                        options={ownerOptions}
                        onChange={(e) => apply({ owner_type: e.target.value })}
                    />
                    <Input
                        className="max-w-xs"
                        placeholder="Buscar por título"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button type="submit" variant="outline">
                        <Search /> Buscar
                    </Button>
                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={filters.expiring}
                            onCheckedChange={(c) =>
                                apply({ expiring: c === true })
                            }
                        />{' '}
                        Solo vencidos o por vencer (30 días)
                    </label>
                </form>

                <DocumentList
                    documents={documents}
                    onEdit={setEditing}
                    onDelete={(doc) =>
                        confirm(`¿Eliminar «${doc.title}»?`) &&
                        router.delete(destroy.url(doc.id), {
                            preserveScroll: true,
                        })
                    }
                />
            </div>
            {editing && (
                <EditDocument
                    key={editing.id}
                    document={editing}
                    categories={categories[editing.owner_type]}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

function EditDocument({
    document,
    categories,
    onClose,
}: {
    document: DocumentRow;
    categories: string[];
    onClose: () => void;
}) {
    const form = useForm({
        title: document.title,
        category: document.category,
        expires_on: document.expires_on ?? '',
        visibility: document.visibility,
    });

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar documento</DialogTitle>
                </DialogHeader>
                <form
                    className="grid gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.transform((data) => ({
                            ...data,
                            expires_on: data.expires_on || null,
                        }));
                        form.submit(DocumentController.update(document.id), {
                            preserveScroll: true,
                            onSuccess: onClose,
                        });
                    }}
                >
                    <div className="grid gap-1">
                        <Label htmlFor="edit-title">Título</Label>
                        <Input
                            id="edit-title"
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                        />
                        <InputError message={form.errors.title} />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="edit-category">Tipo</Label>
                        <NativeSelect
                            id="edit-category"
                            value={form.data.category}
                            options={categories.map((c) => ({
                                value: c,
                                label: c,
                            }))}
                            onChange={(e) =>
                                form.setData('category', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="edit-expires">Vence el</Label>
                        <Input
                            id="edit-expires"
                            type="date"
                            value={form.data.expires_on}
                            onChange={(e) =>
                                form.setData('expires_on', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="edit-visibility">Quién lo ve</Label>
                        <NativeSelect
                            id="edit-visibility"
                            value={form.data.visibility}
                            options={visibilityOptions[document.owner_type]}
                            onChange={(e) =>
                                form.setData('visibility', e.target.value)
                            }
                        />
                    </div>
                    <Button type="submit" disabled={form.processing}>
                        Guardar
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

DocumentsAdmin.layout = {
    breadcrumbs: [{ title: 'Documentos', href: index() }],
};
