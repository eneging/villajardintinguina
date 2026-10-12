import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    HeartPulse,
    Pencil,
    Phone,
    ShieldCheck,
    Trash2,
    UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import StudentProfileController from '@/actions/App/Http/Controllers/StudentProfileController';
import { day, money } from '@/components/billing/format';
import { ChargeStatusBadge } from '@/components/billing/charge-status';
import InputError from '@/components/input-error';
import { DocumentList } from '@/components/school/document-list';
import type { DocumentRow } from '@/components/school/document-list';
import { MediaUploader } from '@/components/school/media-uploader';
import { StudentAvatar } from '@/components/school/student-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    edit as editStudent,
    index as adminStudents,
} from '@/routes/admin/students';
import { mine as attendanceMine } from '@/routes/attendance';
import { index as children } from '@/routes/children';
import { show as showClassroom } from '@/routes/classrooms';
import { index as myPayments } from '@/routes/payments';
import { show } from '@/routes/students';
import type {
    AttendanceStatus,
    AuthorizedPickup,
    Charge,
    MediaItem,
    StudentSummary,
} from '@/types';

type Props = {
    student: StudentSummary & {
        dni: string | null;
        birth_date: string | null;
        sex: 'F' | 'M' | null;
        allergies: string | null;
        medical_notes: string | null;
        image_consent: boolean;
        staff: { name: string; role: string }[];
    };
    guardians: {
        id: number;
        name: string;
        phone: string | null;
        relationship: string;
        can_pick_up: boolean;
        is_billing_contact: boolean;
    }[];
    pickups: AuthorizedPickup[];
    attendance: {
        month: string;
        counts: Partial<Record<AttendanceStatus, number>>;
        records: {
            date: string;
            status: AttendanceStatus;
            picked_up_by: string | null;
        }[];
    };
    charges: Charge[] | null;
    documents: DocumentRow[] | null;
    can: { manage: boolean; updatePhoto: boolean; edit: boolean };
    cloudinaryEnabled: boolean;
};

const attendanceTones: Record<AttendanceStatus, string> = {
    presente: 'bg-green-500',
    tardanza: 'bg-amber-400',
    falta: 'bg-red-500',
    justificada: 'bg-sky-500',
};

const attendanceLabels: Record<AttendanceStatus, string> = {
    presente: 'Asistencias',
    tardanza: 'Tardanzas',
    falta: 'Faltas',
    justificada: 'Justificadas',
};

const staffLabels: Record<string, string> = {
    titular: 'Maestra',
    auxiliar: 'Auxiliar',
    practicante: 'Practicante',
};

function PickupForm({
    studentId,
    cloudinaryEnabled,
}: {
    studentId: number;
    cloudinaryEnabled: boolean;
}) {
    const [photo, setPhoto] = useState<MediaItem | null>(null);
    const form = useForm({
        name: '',
        dni: '',
        relationship: '',
        phone: '',
        photo_media_id: null as number | null,
    });
    const { data, setData, errors, processing } = form;

    return (
        <form
            className="grid gap-3 rounded-xl border border-dashed p-4 sm:grid-cols-2"
            onSubmit={(event) => {
                event.preventDefault();
                form.submit(StudentProfileController.storePickup(studentId), {
                    preserveScroll: true,
                    onSuccess: () => {
                        form.reset();
                        setPhoto(null);
                    },
                });
            }}
        >
            <div className="grid gap-1">
                <Label htmlFor="pickup-name">Nombre completo</Label>
                <Input
                    id="pickup-name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                />
                <InputError message={errors.name} />
            </div>
            <div className="grid gap-1">
                <Label htmlFor="pickup-dni">DNI</Label>
                <Input
                    id="pickup-dni"
                    inputMode="numeric"
                    maxLength={8}
                    value={data.dni}
                    onChange={(e) => setData('dni', e.target.value)}
                />
                <InputError message={errors.dni} />
            </div>
            <div className="grid gap-1">
                <Label htmlFor="pickup-relationship">Parentesco</Label>
                <Input
                    id="pickup-relationship"
                    placeholder="Abuela, tío, movilidad…"
                    value={data.relationship}
                    onChange={(e) => setData('relationship', e.target.value)}
                />
                <InputError message={errors.relationship} />
            </div>
            <div className="grid gap-1">
                <Label htmlFor="pickup-phone">Celular</Label>
                <Input
                    id="pickup-phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                />
            </div>
            <div className="flex items-center gap-3">
                {photo?.thumbnail && (
                    <img
                        src={photo.thumbnail}
                        alt=""
                        className="size-12 rounded-full object-cover"
                    />
                )}
                <MediaUploader
                    target={{ context: 'student', student_id: studentId }}
                    resourceType="image"
                    label={photo ? 'Cambiar foto' : 'Foto (opcional)'}
                    disabled={!cloudinaryEnabled}
                    onUploaded={(media) => {
                        setPhoto(media);
                        setData('photo_media_id', media.id);
                    }}
                />
            </div>
            <Button type="submit" disabled={processing} className="sm:self-end">
                <UserPlus /> Autorizar
            </Button>
        </form>
    );
}

export default function StudentShow({
    student,
    guardians,
    pickups,
    attendance,
    charges,
    documents,
    can,
    cloudinaryEnabled,
}: Props) {
    const [adding, setAdding] = useState(false);
    const balance = (charges ?? []).reduce(
        (sum, charge) =>
            charge.status === 'anulada'
                ? sum
                : sum + Math.max(0, charge.balance),
        0,
    );

    return (
        <>
            <Head title={student.name} />
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <header
                    className="flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center"
                    style={{
                        backgroundColor: `${student.classroom?.color ?? '#16a34a'}22`,
                    }}
                >
                    <div className="space-y-2">
                        <StudentAvatar
                            student={student}
                            className="size-28 ring-4 ring-white"
                        />
                        {can.updatePhoto && (
                            <MediaUploader
                                target={{
                                    context: 'student',
                                    student_id: student.id,
                                }}
                                resourceType="image"
                                label={
                                    student.photo
                                        ? 'Cambiar foto'
                                        : 'Subir foto'
                                }
                                disabled={!cloudinaryEnabled}
                                onUploaded={(media) =>
                                    router.put(
                                        StudentProfileController.updatePhoto.url(
                                            student.id,
                                        ),
                                        { media_id: media.id },
                                        { preserveScroll: true },
                                    )
                                }
                            />
                        )}
                    </div>
                    <div className="flex-1 space-y-1">
                        <h1 className="text-3xl font-bold">{student.name}</h1>
                        <p className="text-muted-foreground">
                            {student.age && `${student.age} · `}
                            {student.birth_date &&
                                `Nació el ${day(student.birth_date)}`}
                            {student.dni && ` · DNI ${student.dni}`}
                        </p>
                        {student.classroom && (
                            <Link
                                href={showClassroom(student.classroom.id)}
                                className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-sm font-medium shadow-sm hover:underline dark:bg-black/30"
                            >
                                {student.classroom.mascot} Salón{' '}
                                {student.classroom.name} ·{' '}
                                {student.classroom.level}
                            </Link>
                        )}
                        {student.staff.length > 0 && (
                            <p className="text-sm">
                                {student.staff
                                    .map(
                                        (member) =>
                                            `${staffLabels[member.role] ?? member.role}: ${member.name}`,
                                    )
                                    .join(' · ')}
                            </p>
                        )}
                    </div>
                    {can.edit && (
                        <Button variant="outline" asChild>
                            <Link href={editStudent(student.id)}>
                                <Pencil /> Editar ficha
                            </Link>
                        </Button>
                    )}
                </header>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="space-y-3 rounded-2xl border bg-card p-5">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <HeartPulse className="size-5 text-red-500" /> Salud
                        </h2>
                        {student.allergies ? (
                            <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                <span>
                                    <strong>Alergias:</strong>{' '}
                                    {student.allergies}
                                </span>
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Sin alergias registradas.
                            </p>
                        )}
                        {student.medical_notes && (
                            <p className="text-sm whitespace-pre-line">
                                {student.medical_notes}
                            </p>
                        )}
                        <p className="flex items-center gap-2 text-sm">
                            <ShieldCheck
                                className={cn(
                                    'size-4',
                                    student.image_consent
                                        ? 'text-green-600'
                                        : 'text-muted-foreground',
                                )}
                            />
                            {student.image_consent
                                ? 'Autoriza el uso de su imagen en fotos.'
                                : 'No autoriza el uso de su imagen.'}
                        </p>
                    </section>

                    <section className="space-y-3 rounded-2xl border bg-card p-5">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="font-semibold">
                                Asistencia de este mes
                            </h2>
                            {can.manage && !can.edit && (
                                <Link
                                    href={attendanceMine()}
                                    className="text-sm hover:underline"
                                >
                                    Ver calendario
                                </Link>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            {(
                                Object.keys(
                                    attendanceLabels,
                                ) as AttendanceStatus[]
                            ).map((status) => (
                                <div
                                    key={status}
                                    className="rounded-xl bg-muted/50 p-2"
                                >
                                    <p className="text-2xl font-bold tabular-nums">
                                        {attendance.counts[status] ?? 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {attendanceLabels[status]}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {attendance.records.map((record) => (
                                <span
                                    key={record.date}
                                    title={`${day(record.date)}: ${record.status}${record.picked_up_by ? ` · recogido por ${record.picked_up_by}` : ''}`}
                                    className={cn(
                                        'flex size-7 items-center justify-center rounded-md text-xs font-medium text-white',
                                        attendanceTones[record.status],
                                    )}
                                >
                                    {Number(record.date.slice(8))}
                                </span>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <div>
                        <h2 className="font-semibold">
                            Apoderados y personas autorizadas para recoger
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            La maestra solo entrega al niño a estas personas,
                            previa verificación del DNI.
                        </p>
                    </div>
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {guardians.map((guardian) => (
                            <li
                                key={guardian.id}
                                className="flex items-center gap-3 rounded-xl border p-3"
                            >
                                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                                    {guardian.name[0]}
                                </span>
                                <div className="min-w-0 flex-1 text-sm">
                                    <p className="font-medium">
                                        {guardian.name}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {guardian.relationship
                                            .charAt(0)
                                            .toUpperCase() +
                                            guardian.relationship.slice(1)}
                                        {guardian.is_billing_contact &&
                                            ' · responsable de pagos'}
                                    </p>
                                    {guardian.phone && (
                                        <a
                                            href={`tel:${guardian.phone}`}
                                            className="inline-flex items-center gap-1 hover:underline"
                                        >
                                            <Phone className="size-3" />{' '}
                                            {guardian.phone}
                                        </a>
                                    )}
                                </div>
                                {guardian.can_pick_up ? (
                                    <Badge variant="secondary">Recoge</Badge>
                                ) : (
                                    <Badge variant="outline">No recoge</Badge>
                                )}
                            </li>
                        ))}
                        {pickups.map((pickup) => (
                            <li
                                key={pickup.id}
                                className="flex items-center gap-3 rounded-xl border p-3"
                            >
                                {pickup.photo?.thumbnail ? (
                                    <img
                                        src={pickup.photo.thumbnail}
                                        alt=""
                                        className="size-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-lg font-semibold text-amber-800">
                                        {pickup.name[0]}
                                    </span>
                                )}
                                <div className="min-w-0 flex-1 text-sm">
                                    <p className="font-medium">{pickup.name}</p>
                                    <p className="text-muted-foreground">
                                        {pickup.relationship}
                                        {pickup.dni && ` · DNI ${pickup.dni}`}
                                    </p>
                                    {pickup.phone && (
                                        <a
                                            href={`tel:${pickup.phone}`}
                                            className="inline-flex items-center gap-1 hover:underline"
                                        >
                                            <Phone className="size-3" />{' '}
                                            {pickup.phone}
                                        </a>
                                    )}
                                </div>
                                {can.manage && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Retirar autorización de ${pickup.name}`}
                                        onClick={() =>
                                            confirm(
                                                `¿Retirar la autorización de ${pickup.name}?`,
                                            ) &&
                                            router.delete(
                                                StudentProfileController.destroyPickup.url(
                                                    pickup.id,
                                                ),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                    {can.manage &&
                        (adding ? (
                            <PickupForm
                                studentId={student.id}
                                cloudinaryEnabled={cloudinaryEnabled}
                            />
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setAdding(true)}
                            >
                                <UserPlus /> Autorizar a otra persona
                            </Button>
                        ))}
                </section>

                {charges && (
                    <section className="space-y-3 rounded-2xl border bg-card p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="font-semibold">Estado de cuenta</h2>
                            <span
                                className={cn(
                                    'rounded-full px-3 py-1 text-sm font-medium',
                                    balance > 0
                                        ? 'bg-amber-100 text-amber-900'
                                        : 'bg-green-100 text-green-900',
                                )}
                            >
                                {balance > 0
                                    ? `Saldo por pagar: ${money(balance)}`
                                    : 'Al día'}
                            </span>
                        </div>
                        {charges.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Sin cuotas registradas.
                            </p>
                        ) : (
                            <ul className="divide-y text-sm">
                                {charges.map((charge) => (
                                    <li
                                        key={charge.id}
                                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                                    >
                                        <span>
                                            {charge.description}
                                            <span className="text-muted-foreground">
                                                {' '}
                                                · vence {day(charge.due_on)}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <span className="tabular-nums">
                                                {money(charge.amount)}
                                            </span>
                                            <ChargeStatusBadge
                                                status={charge.status}
                                                daysLate={charge.days_late}
                                                pending={charge.pending}
                                            />
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!can.edit && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={myPayments()}>Ir a mis pagos</Link>
                            </Button>
                        )}
                    </section>
                )}

                {documents && (
                    <section className="space-y-3">
                        <h2 className="font-semibold">Documentos</h2>
                        <DocumentList documents={documents} />
                    </section>
                )}
            </div>
        </>
    );
}

StudentShow.layout = (props: Props) => ({
    breadcrumbs: [
        ...(props.can.edit
            ? [{ title: 'Alumnos', href: adminStudents() }]
            : props.can.manage
              ? [{ title: 'Mis hijos', href: children() }]
              : []),
        { title: props.student.name, href: show(props.student.id) },
    ],
});
