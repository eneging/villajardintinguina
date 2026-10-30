import { Head, useForm } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import EnrollmentRequestController from '@/actions/App/Http/Controllers/Admin/EnrollmentRequestController';
import { day } from '@/components/billing/format';
import InputError from '@/components/input-error';
import { EnrollmentStatus } from '@/components/school/enrollment-status';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index, show } from '@/routes/admin/enrollments';
import type { EnrollmentRequestItem } from '@/types';

type Props = {
    enrollment: EnrollmentRequestItem & {
        parent: {
            id: number;
            name: string;
            email: string;
            phone: string | null;
            dni: string | null;
        };
    };
    classrooms: { value: number; label: string; level_id: number }[];
};

function Item({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm">{children || '—'}</dd>
        </div>
    );
}

export default function EnrollmentShow({ enrollment, classrooms }: Props) {
    const child = enrollment.child;
    const pending =
        enrollment.status === 'enviada' || enrollment.status === 'observada';
    const approve = useForm({
        classroom_id: (classrooms.find(
            (c) => c.level_id === enrollment.level_id,
        )?.value ?? '') as number | '',
        monthly_fee: '',
        discount_pct: '0',
    });
    const observe = useForm({ status: 'observada', admin_notes: '' });

    return (
        <>
            <Head title={`Matrícula · ${enrollment.child_name}`} />
            <div className="mx-auto grid w-full max-w-5xl gap-6 p-4 lg:grid-cols-[1fr_20rem]">
                <div className="space-y-6">
                    <header className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold">
                            {enrollment.child_name}
                        </h1>
                        <EnrollmentStatus
                            status={enrollment.status}
                            label={enrollment.status_label}
                        />
                    </header>
                    <p className="text-sm text-muted-foreground">
                        Año {enrollment.year} ·{' '}
                        {enrollment.level ?? 'nivel por asignar'} · enviada el{' '}
                        {day(enrollment.created_at)}
                        {enrollment.student_id &&
                            ' · re-matrícula de un alumno existente'}
                    </p>

                    <section className="rounded-2xl border bg-card p-5">
                        <h2 className="mb-3 font-semibold">Niño o niña</h2>
                        <dl className="grid gap-3 sm:grid-cols-3">
                            <Item label="DNI">{child.dni}</Item>
                            <Item label="Nacimiento">
                                {child.birth_date && day(child.birth_date)}
                            </Item>
                            <Item label="Sexo">
                                {child.sex === 'F' ? 'Niña' : 'Niño'}
                            </Item>
                            <Item label="Grupo sanguíneo">
                                {child.blood_type}
                            </Item>
                            <Item label="Seguro">{child.insurance}</Item>
                            <Item label="Alergias">{child.allergies}</Item>
                            <div className="sm:col-span-3">
                                <Item label="Indicaciones médicas">
                                    {child.medical_notes}
                                </Item>
                            </div>
                            <Item label="Autoriza imagen">
                                {enrollment.image_consent ? 'Sí' : 'No'}
                            </Item>
                        </dl>
                    </section>

                    <section className="rounded-2xl border bg-card p-5">
                        <h2 className="mb-3 font-semibold">Familia</h2>
                        <dl className="grid gap-3 sm:grid-cols-3">
                            <Item
                                label={`Apoderado (${enrollment.relationship})`}
                            >
                                {enrollment.parent.name}
                            </Item>
                            <Item label="Celular">
                                {enrollment.parent.phone}
                            </Item>
                            <Item label="Correo">
                                {enrollment.parent.email}
                            </Item>
                            <Item label="Otro apoderado">
                                {enrollment.second_guardian?.name}
                                {enrollment.second_guardian?.phone &&
                                    ` · ${enrollment.second_guardian.phone}`}
                            </Item>
                            <Item label="Emergencia">
                                {enrollment.emergency_contact?.name} ·{' '}
                                {enrollment.emergency_contact?.phone}
                            </Item>
                        </dl>
                        {enrollment.pickups.length > 0 && (
                            <>
                                <h3 className="mt-4 mb-2 text-sm font-semibold">
                                    Autorizados a recoger
                                </h3>
                                <ul className="space-y-1 text-sm">
                                    {enrollment.pickups.map((p) => (
                                        <li key={p.dni}>
                                            {p.name} · {p.relationship} · DNI{' '}
                                            {p.dni}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </section>

                    <section className="rounded-2xl border bg-card p-5">
                        <h2 className="mb-3 font-semibold">Documentos</h2>
                        {enrollment.documents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No adjuntó documentos.
                            </p>
                        ) : (
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {enrollment.documents.map((doc) => (
                                    <li key={doc.media_id}>
                                        <a
                                            href={doc.media?.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 rounded-xl border p-3 hover:bg-accent"
                                        >
                                            {doc.media?.thumbnail ? (
                                                <img
                                                    src={doc.media.thumbnail}
                                                    alt=""
                                                    className="size-14 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <FileText className="size-8" />
                                            )}
                                            <span className="text-sm font-medium">
                                                {doc.label}
                                            </span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                <aside className="space-y-4">
                    {pending ? (
                        <>
                            <form
                                className="space-y-3 rounded-2xl border bg-card p-5"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    approve.submit(
                                        EnrollmentRequestController.approve(
                                            enrollment.id,
                                        ),
                                    );
                                }}
                            >
                                <h2 className="font-semibold">
                                    Aprobar matrícula
                                </h2>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="classroom_id">Salón</Label>
                                    <NativeSelect
                                        id="classroom_id"
                                        value={approve.data.classroom_id}
                                        placeholder="Elegir salón"
                                        options={classrooms}
                                        onChange={(e) =>
                                            approve.setData(
                                                'classroom_id',
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : '',
                                            )
                                        }
                                    />
                                    <InputError
                                        message={approve.errors.classroom_id}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="monthly_fee">
                                            Mensualidad (S/)
                                        </Label>
                                        <Input
                                            id="monthly_fee"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={approve.data.monthly_fee}
                                            onChange={(e) =>
                                                approve.setData(
                                                    'monthly_fee',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="discount_pct">
                                            Descuento %
                                        </Label>
                                        <Input
                                            id="discount_pct"
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={approve.data.discount_pct}
                                            onChange={(e) =>
                                                approve.setData(
                                                    'discount_pct',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <InputError
                                    message={approve.errors.monthly_fee}
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={approve.processing}
                                >
                                    Aprobar y matricular
                                </Button>
                            </form>
                            <form
                                className="space-y-3 rounded-2xl border bg-card p-5"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    observe.submit(
                                        EnrollmentRequestController.observe(
                                            enrollment.id,
                                        ),
                                        { preserveScroll: true },
                                    );
                                }}
                            >
                                <h2 className="font-semibold">
                                    Observar o rechazar
                                </h2>
                                <NativeSelect
                                    aria-label="Acción"
                                    value={observe.data.status}
                                    options={[
                                        {
                                            value: 'observada',
                                            label: 'Pedir corrección a la familia',
                                        },
                                        {
                                            value: 'rechazada',
                                            label: 'Rechazar solicitud',
                                        },
                                    ]}
                                    onChange={(e) =>
                                        observe.setData(
                                            'status',
                                            e.target.value,
                                        )
                                    }
                                />
                                <textarea
                                    aria-label="Motivo"
                                    placeholder="Falta el carné de vacunas…"
                                    className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                    value={observe.data.admin_notes}
                                    onChange={(e) =>
                                        observe.setData(
                                            'admin_notes',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={observe.errors.admin_notes}
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="w-full"
                                    disabled={observe.processing}
                                >
                                    Enviar a la familia
                                </Button>
                            </form>
                        </>
                    ) : (
                        <p className="rounded-2xl border bg-card p-5 text-sm">
                            Solicitud {enrollment.status_label.toLowerCase()}
                            {enrollment.reviewed_at &&
                                ` el ${day(enrollment.reviewed_at)}`}
                            .
                            {enrollment.admin_notes && (
                                <span className="mt-2 block text-muted-foreground">
                                    {enrollment.admin_notes}
                                </span>
                            )}
                        </p>
                    )}
                </aside>
            </div>
        </>
    );
}

EnrollmentShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Matrículas en línea', href: index() },
        { title: props.enrollment.child_name, href: show(props.enrollment.id) },
    ],
});
