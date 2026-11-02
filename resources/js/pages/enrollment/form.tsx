import { Head, Link, useForm } from '@inertiajs/react';
import { FileCheck2, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import EnrollmentController from '@/actions/App/Http/Controllers/Parent/EnrollmentController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { MediaUploader } from '@/components/school/media-uploader';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { privacy } from '@/routes';
import { index as documents } from '@/routes/documents';
import { index } from '@/routes/enrollment';
import type { EnrollmentRequestItem, Option } from '@/types';

type NumberOption = { value: number; label: string };

type Prefill = {
    student_id: number;
    child: EnrollmentRequestItem['child'];
    relationship: string | null;
    pickups: EnrollmentRequestItem['pickups'];
    image_consent: boolean;
} | null;

type Props = {
    enrollment: EnrollmentRequestItem | null;
    prefill: Prefill;
    years: NumberOption[];
    levels: NumberOption[];
    documentTypes: Option[];
    cloudinaryEnabled: boolean;
};

const textareaClass =
    'min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-4 rounded-2xl border bg-card p-5">
            <div>
                <h2 className="font-semibold">{title}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}

function Field({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

export default function EnrollmentForm({
    enrollment,
    prefill,
    years,
    levels,
    documentTypes,
    cloudinaryEnabled,
}: Props) {
    const source = enrollment ?? prefill;
    const form = useForm({
        student_id: (enrollment?.student_id ?? prefill?.student_id ?? null) as
            | number
            | null,
        school_year_id: (enrollment?.school_year_id ??
            years.at(-1)?.value ??
            '') as number | '',
        level_id: (enrollment?.level_id ?? '') as number | '',
        child: {
            first_name: source?.child.first_name ?? '',
            last_name: source?.child.last_name ?? '',
            dni: source?.child.dni ?? '',
            birth_date: source?.child.birth_date ?? '',
            sex: source?.child.sex ?? '',
            blood_type: source?.child.blood_type ?? '',
            allergies: source?.child.allergies ?? '',
            medical_notes: source?.child.medical_notes ?? '',
            insurance: source?.child.insurance ?? '',
        },
        relationship:
            enrollment?.relationship ?? prefill?.relationship ?? 'madre',
        second_guardian: {
            name: enrollment?.second_guardian?.name ?? '',
            dni: enrollment?.second_guardian?.dni ?? '',
            phone: enrollment?.second_guardian?.phone ?? '',
            relationship: enrollment?.second_guardian?.relationship ?? '',
        },
        emergency_contact: {
            name: enrollment?.emergency_contact?.name ?? '',
            phone: enrollment?.emergency_contact?.phone ?? '',
        },
        pickups: (source?.pickups ?? []).map((p) => ({
            name: p.name,
            dni: p.dni,
            relationship: p.relationship,
            phone: p.phone ?? '',
        })),
        documents: (enrollment?.documents ?? []).map((d) => ({
            type: d.type,
            media_id: d.media_id,
            label: d.label,
            filename: d.media?.original_filename ?? d.label,
        })),
        image_consent:
            enrollment?.image_consent ?? prefill?.image_consent ?? false,
        rules_accepted: false,
    });
    const { data, setData, processing } = form;
    const errors = form.errors as Record<string, string | undefined>;
    const firstError = (prefix: string) =>
        Object.entries(errors).find(([key]) => key.startsWith(prefix))?.[1];
    const setChild = (key: keyof typeof data.child, value: string) =>
        setData('child', { ...data.child, [key]: value });

    return (
        <>
            <Head title="Matrícula en línea" />
            <form
                className="mx-auto w-full max-w-3xl space-y-6 p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((values) => ({
                        ...values,
                        level_id:
                            values.level_id === '' ? null : values.level_id,
                        documents: values.documents.map(
                            ({ type, media_id }) => ({ type, media_id }),
                        ),
                        child: {
                            ...values.child,
                            dni: values.child.dni || null,
                        },
                        second_guardian: {
                            ...values.second_guardian,
                            dni: values.second_guardian.dni || null,
                        },
                    }));
                    form.submit(
                        enrollment
                            ? EnrollmentController.update(enrollment.id)
                            : EnrollmentController.store(),
                    );
                }}
            >
                <Heading
                    title={
                        prefill
                            ? `Re-matrícula de ${prefill.child.first_name}`
                            : 'Matrícula en línea'
                    }
                    description="Revisa que los datos estén completos. La dirección te avisará cuando la apruebe o si falta algo."
                />
                {enrollment?.status === 'observada' &&
                    enrollment.admin_notes && (
                        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                            <strong>Observación de la dirección:</strong>{' '}
                            {enrollment.admin_notes}
                        </p>
                    )}

                <Section title="Año y nivel">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            id="school_year_id"
                            label="Año escolar"
                            error={errors.school_year_id}
                        >
                            <NativeSelect
                                id="school_year_id"
                                value={data.school_year_id}
                                options={years}
                                onChange={(e) =>
                                    setData(
                                        'school_year_id',
                                        Number(e.target.value),
                                    )
                                }
                            />
                        </Field>
                        <Field id="level_id" label="Nivel al que postula">
                            <NativeSelect
                                id="level_id"
                                value={data.level_id}
                                placeholder="Que lo asigne la dirección"
                                options={levels}
                                onChange={(e) =>
                                    setData(
                                        'level_id',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : '',
                                    )
                                }
                            />
                        </Field>
                    </div>
                </Section>

                <Section title="Datos del niño o niña">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            id="first_name"
                            label="Nombres"
                            error={errors['child.first_name']}
                        >
                            <Input
                                id="first_name"
                                value={data.child.first_name}
                                onChange={(e) =>
                                    setChild('first_name', e.target.value)
                                }
                            />
                        </Field>
                        <Field
                            id="last_name"
                            label="Apellidos"
                            error={errors['child.last_name']}
                        >
                            <Input
                                id="last_name"
                                value={data.child.last_name}
                                onChange={(e) =>
                                    setChild('last_name', e.target.value)
                                }
                            />
                        </Field>
                        <Field id="dni" label="DNI" error={errors['child.dni']}>
                            <Input
                                id="dni"
                                inputMode="numeric"
                                maxLength={8}
                                value={data.child.dni ?? ''}
                                onChange={(e) =>
                                    setChild('dni', e.target.value)
                                }
                            />
                        </Field>
                        <Field
                            id="birth_date"
                            label="Fecha de nacimiento"
                            error={errors['child.birth_date']}
                        >
                            <Input
                                id="birth_date"
                                type="date"
                                value={data.child.birth_date}
                                onChange={(e) =>
                                    setChild('birth_date', e.target.value)
                                }
                            />
                        </Field>
                        <Field
                            id="sex"
                            label="Sexo"
                            error={errors['child.sex']}
                        >
                            <NativeSelect
                                id="sex"
                                value={data.child.sex}
                                placeholder="Elegir"
                                options={[
                                    { value: 'F', label: 'Niña' },
                                    { value: 'M', label: 'Niño' },
                                ]}
                                onChange={(e) =>
                                    setChild('sex', e.target.value)
                                }
                            />
                        </Field>
                        <Field
                            id="relationship"
                            label="Tú eres su…"
                            error={errors.relationship}
                        >
                            <NativeSelect
                                id="relationship"
                                value={data.relationship}
                                options={[
                                    'madre',
                                    'padre',
                                    'abuela',
                                    'abuelo',
                                    'tía',
                                    'tío',
                                    'apoderado',
                                ].map((r) => ({
                                    value: r,
                                    label: r[0].toUpperCase() + r.slice(1),
                                }))}
                                onChange={(e) =>
                                    setData('relationship', e.target.value)
                                }
                            />
                        </Field>
                    </div>
                </Section>

                <Section
                    title="Salud"
                    description="Ayuda a las maestras a cuidar a tu hijo."
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="blood_type" label="Grupo sanguíneo">
                            <Input
                                id="blood_type"
                                placeholder="O+"
                                value={data.child.blood_type ?? ''}
                                onChange={(e) =>
                                    setChild('blood_type', e.target.value)
                                }
                            />
                        </Field>
                        <Field id="insurance" label="Seguro de salud">
                            <Input
                                id="insurance"
                                placeholder="SIS, EsSalud, EPS…"
                                value={data.child.insurance ?? ''}
                                onChange={(e) =>
                                    setChild('insurance', e.target.value)
                                }
                            />
                        </Field>
                        <Field id="allergies" label="Alergias">
                            <Input
                                id="allergies"
                                placeholder="Ninguna"
                                value={data.child.allergies ?? ''}
                                onChange={(e) =>
                                    setChild('allergies', e.target.value)
                                }
                            />
                        </Field>
                        <div className="sm:col-span-2">
                            <Field
                                id="medical_notes"
                                label="Otras indicaciones médicas"
                            >
                                <textarea
                                    id="medical_notes"
                                    className={textareaClass}
                                    value={data.child.medical_notes ?? ''}
                                    onChange={(e) =>
                                        setChild(
                                            'medical_notes',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </div>
                    </div>
                </Section>

                <Section title="Familia y emergencias">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            id="sg_name"
                            label="Otro padre/madre o apoderado (opcional)"
                        >
                            <Input
                                id="sg_name"
                                value={data.second_guardian.name}
                                onChange={(e) =>
                                    setData('second_guardian', {
                                        ...data.second_guardian,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </Field>
                        <Field id="sg_phone" label="Su celular">
                            <Input
                                id="sg_phone"
                                type="tel"
                                value={data.second_guardian.phone}
                                onChange={(e) =>
                                    setData('second_guardian', {
                                        ...data.second_guardian,
                                        phone: e.target.value,
                                    })
                                }
                            />
                        </Field>
                        <Field
                            id="em_name"
                            label="Contacto de emergencia"
                            error={errors['emergency_contact.name']}
                        >
                            <Input
                                id="em_name"
                                value={data.emergency_contact.name}
                                onChange={(e) =>
                                    setData('emergency_contact', {
                                        ...data.emergency_contact,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </Field>
                        <Field
                            id="em_phone"
                            label="Celular de emergencia"
                            error={errors['emergency_contact.phone']}
                        >
                            <Input
                                id="em_phone"
                                type="tel"
                                value={data.emergency_contact.phone}
                                onChange={(e) =>
                                    setData('emergency_contact', {
                                        ...data.emergency_contact,
                                        phone: e.target.value,
                                    })
                                }
                            />
                        </Field>
                    </div>
                </Section>

                <Section
                    title="Personas autorizadas a recogerlo"
                    description="Además de ti. La maestra verificará su DNI al entregar al niño."
                >
                    {data.pickups.map((pickup, index) => (
                        <div
                            key={index}
                            className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_8rem_8rem_auto]"
                        >
                            <Input
                                aria-label="Nombre"
                                placeholder="Nombre completo"
                                value={pickup.name}
                                onChange={(e) =>
                                    setData(
                                        'pickups',
                                        data.pickups.map((p, i) =>
                                            i === index
                                                ? { ...p, name: e.target.value }
                                                : p,
                                        ),
                                    )
                                }
                            />
                            <Input
                                aria-label="DNI"
                                placeholder="DNI"
                                inputMode="numeric"
                                maxLength={8}
                                value={pickup.dni}
                                onChange={(e) =>
                                    setData(
                                        'pickups',
                                        data.pickups.map((p, i) =>
                                            i === index
                                                ? { ...p, dni: e.target.value }
                                                : p,
                                        ),
                                    )
                                }
                            />
                            <Input
                                aria-label="Parentesco"
                                placeholder="Abuela"
                                value={pickup.relationship}
                                onChange={(e) =>
                                    setData(
                                        'pickups',
                                        data.pickups.map((p, i) =>
                                            i === index
                                                ? {
                                                      ...p,
                                                      relationship:
                                                          e.target.value,
                                                  }
                                                : p,
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
                                    setData(
                                        'pickups',
                                        data.pickups.filter(
                                            (_, i) => i !== index,
                                        ),
                                    )
                                }
                            >
                                <Trash2 />
                            </Button>
                        </div>
                    ))}
                    <InputError message={firstError('pickups')} />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setData('pickups', [
                                ...data.pickups,
                                {
                                    name: '',
                                    dni: '',
                                    relationship: '',
                                    phone: '',
                                },
                            ])
                        }
                    >
                        <Plus /> Agregar persona
                    </Button>
                </Section>

                <Section
                    title="Documentos"
                    description="Foto clara o PDF. Puedes completarlos después si aún no los tienes."
                >
                    {data.documents.length > 0 && (
                        <ul className="divide-y rounded-xl border text-sm">
                            {data.documents.map((doc, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-2 px-3 py-2"
                                >
                                    <FileCheck2 className="size-4 text-green-600" />
                                    <span className="flex-1">
                                        <span className="font-medium">
                                            {doc.label}
                                        </span>{' '}
                                        · {doc.filename}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="Quitar"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() =>
                                            setData(
                                                'documents',
                                                data.documents.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {documentTypes.map((type) => (
                            <MediaUploader
                                key={type.value}
                                target={{ context: 'enrollment' }}
                                resourceType="image"
                                label={type.label}
                                disabled={!cloudinaryEnabled}
                                onUploaded={(media) =>
                                    setData('documents', [
                                        ...data.documents,
                                        {
                                            type: type.value,
                                            media_id: media.id,
                                            label: type.label,
                                            filename:
                                                media.original_filename ??
                                                type.label,
                                        },
                                    ])
                                }
                            />
                        ))}
                    </div>
                    <InputError message={firstError('documents')} />
                    {!cloudinaryEnabled && (
                        <p className="text-sm text-muted-foreground">
                            La subida de archivos aún no está configurada;
                            entrega los documentos en la dirección.
                        </p>
                    )}
                </Section>

                <Section title="Autorizaciones">
                    <label className="flex items-start gap-3 text-sm">
                        <Checkbox
                            checked={data.image_consent}
                            onCheckedChange={(c) =>
                                setData('image_consent', c === true)
                            }
                            className="mt-0.5"
                        />
                        Autorizo el uso de la imagen de mi hijo en las fotos y
                        videos de las actividades del colegio.
                    </label>
                    <label className="flex items-start gap-3 text-sm">
                        <Checkbox
                            checked={data.rules_accepted}
                            onCheckedChange={(c) =>
                                setData('rules_accepted', c === true)
                            }
                            className="mt-0.5"
                        />
                        <span>
                            Leí y acepto el reglamento interno del colegio
                            (disponible en{' '}
                            <Link href={documents()} className="underline">
                                Documentos
                            </Link>
                            ), declaro que los datos son verdaderos y acepto la{' '}
                            <Link
                                href={privacy()}
                                className="underline"
                                target="_blank"
                            >
                                política de privacidad
                            </Link>
                            .
                        </span>
                    </label>
                    <InputError message={errors.rules_accepted} />
                </Section>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" asChild>
                        <Link href={index()}>Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {enrollment ? 'Guardar y reenviar' : 'Enviar matrícula'}
                    </Button>
                </div>
            </form>
        </>
    );
}

EnrollmentForm.layout = {
    breadcrumbs: [{ title: 'Matrícula en línea', href: index() }],
};
