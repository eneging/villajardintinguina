import { Head, router, useForm } from '@inertiajs/react';
import StaffAttendanceController from '@/actions/App/Http/Controllers/Admin/StaffAttendanceController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localToday } from '@/lib/school';
import { index } from '@/routes/admin/staff-attendance';

type Row = {
    user: { id: number; name: string };
    business_days: number;
    present: number;
    late: number;
    late_minutes: number;
    justified: number;
    absences: number;
};

type Props = { month: string; summary: Row[]; statuses: string[] };

export default function StaffAttendanceAdmin({
    month,
    summary,
    statuses,
}: Props) {
    const form = useForm({
        user_id: summary[0]?.user.id ?? '',
        date: localToday(),
        status: 'justificada',
        check_in: '',
        check_out: '',
        notes: '',
    });

    return (
        <>
            <Head title="Asistencia del personal" />
            <div className="space-y-8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Asistencia del personal"
                        description="Resumen del mes (días hábiles, sin feriados). Se usará para la planilla."
                    />
                    <Input
                        type="month"
                        className="w-44"
                        value={month}
                        onChange={(e) =>
                            router.get(index.url(), { mes: e.target.value })
                        }
                    />
                </div>

                <div className="overflow-x-auto rounded-2xl border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3 font-medium">Persona</th>
                                <th className="p-3 text-center font-medium">
                                    Días hábiles
                                </th>
                                <th className="p-3 text-center font-medium">
                                    Asistió
                                </th>
                                <th className="p-3 text-center font-medium">
                                    Tardanzas
                                </th>
                                <th className="p-3 text-center font-medium">
                                    Min. tarde
                                </th>
                                <th className="p-3 text-center font-medium">
                                    Justificadas
                                </th>
                                <th className="p-3 text-center font-medium">
                                    Faltas
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {summary.map((row) => (
                                <tr key={row.user.id}>
                                    <td className="p-3 font-medium">
                                        {row.user.name}
                                    </td>
                                    <td className="p-3 text-center">
                                        {row.business_days}
                                    </td>
                                    <td className="p-3 text-center">
                                        {row.present}
                                    </td>
                                    <td className="p-3 text-center text-amber-700">
                                        {row.late}
                                    </td>
                                    <td className="p-3 text-center text-amber-700">
                                        {row.late_minutes}
                                    </td>
                                    <td className="p-3 text-center text-sky-700">
                                        {row.justified}
                                    </td>
                                    <td
                                        className={`p-3 text-center font-semibold ${row.absences > 0 ? 'text-red-700' : ''}`}
                                    >
                                        {row.absences}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {summary.length === 0 && (
                        <p className="p-8 text-center text-muted-foreground">
                            No hay maestras ni practicantes activas.
                        </p>
                    )}
                </div>

                <form
                    className="space-y-4 rounded-2xl border bg-card p-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.submit(StaffAttendanceController.store(), {
                            preserveScroll: true,
                            onSuccess: () =>
                                form.reset('notes', 'check_in', 'check_out'),
                        });
                    }}
                >
                    <Heading
                        variant="small"
                        title="Registro manual"
                        description="Para faltas justificadas, permisos u olvidos de marcación. Reemplaza el registro de ese día."
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="user_id">Persona</Label>
                            <NativeSelect
                                id="user_id"
                                value={form.data.user_id}
                                options={summary.map((r) => ({
                                    value: r.user.id,
                                    label: r.user.name,
                                }))}
                                onChange={(e) =>
                                    form.setData(
                                        'user_id',
                                        Number(e.target.value),
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Input
                                id="date"
                                type="date"
                                value={form.data.date}
                                onChange={(e) =>
                                    form.setData('date', e.target.value)
                                }
                            />
                            <InputError message={form.errors.date} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Estado</Label>
                            <NativeSelect
                                id="status"
                                value={form.data.status}
                                options={statuses.map((s) => ({
                                    value: s,
                                    label: s[0].toUpperCase() + s.slice(1),
                                }))}
                                onChange={(e) =>
                                    form.setData('status', e.target.value)
                                }
                            />
                        </div>
                        {(form.data.status === 'puntual' ||
                            form.data.status === 'tardanza') && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="check_in">Entrada</Label>
                                    <Input
                                        id="check_in"
                                        type="time"
                                        value={form.data.check_in}
                                        onChange={(e) =>
                                            form.setData(
                                                'check_in',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="check_out">Salida</Label>
                                    <Input
                                        id="check_out"
                                        type="time"
                                        value={form.data.check_out}
                                        onChange={(e) =>
                                            form.setData(
                                                'check_out',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </>
                        )}
                        <div className="grid gap-2 sm:col-span-3">
                            <Label htmlFor="notes">Motivo</Label>
                            <Input
                                id="notes"
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                                placeholder="Cita médica con certificado"
                            />
                            <InputError message={form.errors.notes} />
                        </div>
                    </div>
                    <Button type="submit" disabled={form.processing}>
                        Guardar registro
                    </Button>
                </form>
            </div>
        </>
    );
}

StaffAttendanceAdmin.layout = {
    breadcrumbs: [{ title: 'Asistencia del personal', href: index() }],
};
