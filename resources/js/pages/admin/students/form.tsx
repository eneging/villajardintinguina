import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import StudentController from '@/actions/App/Http/Controllers/Admin/StudentController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { textareaClass } from '@/components/school/block-editor';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/students';
import { create as createUser } from '@/routes/admin/users';

type NumberOption = { value: number; label: string };

type Guardian = {
    user_id: number | '';
    relationship: string;
    is_billing_contact: boolean;
    can_pick_up: boolean;
};

type Enrollment = {
    classroom_id: number | '';
    monthly_fee: string;
    discount_pct: string;
    status: 'active' | 'withdrawn';
};

type Props = {
    student: {
        id: number;
        first_name: string;
        last_name: string;
        dni: string | null;
        birth_date: string | null;
        sex: 'F' | 'M' | null;
        allergies: string | null;
        medical_notes: string | null;
        image_consent: boolean;
        guardians: Guardian[];
        enrollment: Enrollment | null;
    } | null;
    parents: NumberOption[];
    classrooms: NumberOption[];
    year: number | null;
};

const relationships = [
    'madre',
    'padre',
    'abuela',
    'abuelo',
    'tía',
    'tío',
    'apoderado',
];

export default function StudentForm({
    student,
    parents,
    classrooms,
    year,
}: Props) {
    const form = useForm({
        first_name: student?.first_name ?? '',
        last_name: student?.last_name ?? '',
        dni: student?.dni ?? '',
        birth_date: student?.birth_date ?? '',
        sex: student?.sex ?? '',
        allergies: student?.allergies ?? '',
        medical_notes: student?.medical_notes ?? '',
        image_consent: student?.image_consent ?? false,
        guardians: student?.guardians ?? ([] as Guardian[]),
        enrolled: student ? student.enrollment !== null : true,
        enrollment:
            student?.enrollment ??
            ({
                classroom_id: '',
                monthly_fee: '',
                discount_pct: '0',
                status: 'active',
            } as Enrollment),
    });
    const { data, setData, errors, processing } = form;
    const allErrors = errors as Record<string, string | undefined>;

    function updateGuardian(i: number, patch: Partial<Guardian>) {
        setData(
            'guardians',
            data.guardians.map((g, index) =>
                index === i ? { ...g, ...patch } : g,
            ),
        );
    }

    return (
        <>
            <Head
                title={
                    student
                        ? `${student.first_name} ${student.last_name}`
                        : 'Nuevo alumno'
                }
            />
            <form
                className="mx-auto w-full max-w-3xl space-y-6 p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform(({ enrolled, ...values }) => ({
                        ...values,
                        enrollment: enrolled ? values.enrollment : null,
                    }));
                    form.submit(
                        student
                            ? StudentController.update(student.id)
                            : StudentController.store(),
                    );
                }}
            >
                <Heading
                    title={student ? 'Ficha del alumno' : 'Nuevo alumno'}
                    description="Datos del niño, sus apoderados y su matrícula."
                />

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="first_name">Nombres</Label>
                            <Input
                                id="first_name"
                                value={data.first_name}
                                onChange={(e) =>
                                    setData('first_name', e.target.value)
                                }
                            />
                            <InputError message={errors.first_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="last_name">Apellidos</Label>
                            <Input
                                id="last_name"
                                value={data.last_name}
                                onChange={(e) =>
                                    setData('last_name', e.target.value)
                                }
                            />
                            <InputError message={errors.last_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dni">DNI</Label>
                            <Input
                                id="dni"
                                inputMode="numeric"
                                value={data.dni}
                                onChange={(e) => setData('dni', e.target.value)}
                            />
                            <InputError message={errors.dni} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="birth_date">Nacimiento</Label>
                                <Input
                                    id="birth_date"
                                    type="date"
                                    value={data.birth_date}
                                    onChange={(e) =>
                                        setData('birth_date', e.target.value)
                                    }
                                />
                                <InputError message={errors.birth_date} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sex">Sexo</Label>
                                <NativeSelect
                                    id="sex"
                                    value={data.sex}
                                    placeholder="—"
                                    options={[
                                        { value: 'F', label: 'Niña' },
                                        { value: 'M', label: 'Niño' },
                                    ]}
                                    onChange={(e) =>
                                        setData(
                                            'sex',
                                            e.target.value as 'F' | 'M' | '',
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="allergies">Alergias</Label>
                            <textarea
                                id="allergies"
                                className={textareaClass}
                                value={data.allergies}
                                onChange={(e) =>
                                    setData('allergies', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="medical_notes">Notas médicas</Label>
                            <textarea
                                id="medical_notes"
                                className={textareaClass}
                                value={data.medical_notes}
                                onChange={(e) =>
                                    setData('medical_notes', e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="image_consent"
                            checked={data.image_consent}
                            onCheckedChange={(checked) =>
                                setData('image_consent', checked === true)
                            }
                        />
                        <Label htmlFor="image_consent" className="leading-snug">
                            Los padres autorizan el uso de su imagen (fotos y
                            videos en la galería del salón)
                        </Label>
                    </div>
                </section>

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Heading
                            variant="small"
                            title="Apoderados"
                            description="Deben tener una cuenta con rol Padre / Madre."
                        />
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={createUser()}>
                                Crear cuenta de padre
                            </Link>
                        </Button>
                    </div>
                    {data.guardians.map((guardian, i) => (
                        <div
                            key={i}
                            className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_10rem_auto]"
                        >
                            <div className="grid gap-1">
                                <NativeSelect
                                    aria-label="Apoderado"
                                    value={guardian.user_id}
                                    placeholder="Elige una persona"
                                    options={parents}
                                    onChange={(e) =>
                                        updateGuardian(i, {
                                            user_id: e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        })
                                    }
                                />
                                <InputError
                                    message={
                                        allErrors[`guardians.${i}.user_id`]
                                    }
                                />
                            </div>
                            <NativeSelect
                                aria-label="Parentesco"
                                value={guardian.relationship}
                                options={relationships.map((r) => ({
                                    value: r,
                                    label: r,
                                }))}
                                onChange={(e) =>
                                    updateGuardian(i, {
                                        relationship: e.target.value,
                                    })
                                }
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Quitar"
                                onClick={() =>
                                    setData(
                                        'guardians',
                                        data.guardians.filter(
                                            (_, index) => index !== i,
                                        ),
                                    )
                                }
                            >
                                <Trash2 />
                            </Button>
                            <div className="flex flex-wrap gap-4 sm:col-span-3">
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={guardian.is_billing_contact}
                                        onCheckedChange={(c) =>
                                            updateGuardian(i, {
                                                is_billing_contact: c === true,
                                            })
                                        }
                                    />
                                    Responsable de pagos
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={guardian.can_pick_up}
                                        onCheckedChange={(c) =>
                                            updateGuardian(i, {
                                                can_pick_up: c === true,
                                            })
                                        }
                                    />
                                    Puede recogerlo
                                </label>
                            </div>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setData('guardians', [
                                ...data.guardians,
                                {
                                    user_id: '',
                                    relationship: 'madre',
                                    is_billing_contact:
                                        data.guardians.length === 0,
                                    can_pick_up: true,
                                },
                            ])
                        }
                    >
                        <Plus /> Agregar apoderado
                    </Button>
                </section>

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="enrolled"
                            checked={data.enrolled}
                            onCheckedChange={(c) =>
                                setData('enrolled', c === true)
                            }
                        />
                        <Label
                            htmlFor="enrolled"
                            className="text-base font-semibold"
                        >
                            Matrícula {year}
                        </Label>
                    </div>
                    {data.enrolled && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="classroom_id">Salón</Label>
                                <NativeSelect
                                    id="classroom_id"
                                    value={data.enrollment.classroom_id}
                                    placeholder="Elige un salón"
                                    options={classrooms}
                                    onChange={(e) =>
                                        setData('enrollment', {
                                            ...data.enrollment,
                                            classroom_id: e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        })
                                    }
                                />
                                <InputError
                                    message={
                                        allErrors['enrollment.classroom_id']
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Estado</Label>
                                <NativeSelect
                                    id="status"
                                    value={data.enrollment.status}
                                    options={[
                                        { value: 'active', label: 'Activo' },
                                        {
                                            value: 'withdrawn',
                                            label: 'Retirado',
                                        },
                                    ]}
                                    onChange={(e) =>
                                        setData('enrollment', {
                                            ...data.enrollment,
                                            status: e.target
                                                .value as Enrollment['status'],
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="monthly_fee">
                                    Mensualidad (S/)
                                </Label>
                                <Input
                                    id="monthly_fee"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={data.enrollment.monthly_fee}
                                    onChange={(e) =>
                                        setData('enrollment', {
                                            ...data.enrollment,
                                            monthly_fee: e.target.value,
                                        })
                                    }
                                />
                                <InputError
                                    message={
                                        allErrors['enrollment.monthly_fee']
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="discount_pct">
                                    Descuento (%)
                                </Label>
                                <Input
                                    id="discount_pct"
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    value={data.enrollment.discount_pct}
                                    onChange={(e) =>
                                        setData('enrollment', {
                                            ...data.enrollment,
                                            discount_pct: e.target.value,
                                        })
                                    }
                                />
                                <InputError
                                    message={
                                        allErrors['enrollment.discount_pct']
                                    }
                                />
                            </div>
                        </div>
                    )}
                </section>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" asChild>
                        <Link href={index()}>Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        Guardar
                    </Button>
                </div>
            </form>
        </>
    );
}

StudentForm.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Alumnos', href: index() },
        {
            title: props.student
                ? `${props.student.first_name} ${props.student.last_name}`
                : 'Nuevo',
            href: index(),
        },
    ],
});
