import { Form, Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarPlus,
    Check,
    Layers,
    Search,
    X,
} from 'lucide-react';
import BillingController from '@/actions/App/Http/Controllers/Admin/BillingController';
import { useState } from 'react';
import { ChargeStatusBadge } from '@/components/billing/charge-status';
import { day, money } from '@/components/billing/format';
import { PaymentHistory } from '@/components/billing/payment-history';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    confirm as confirmPayment,
    reject as rejectPayment,
} from '@/routes/admin/billing/payments';
import { debtors, generate, index, student } from '@/routes/admin/billing';
import type { Charge, PaymentRecord } from '@/types';

function BulkChargeDialog({
    classrooms,
}: {
    classrooms: { value: number; label: string }[];
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Layers /> Cargo masivo
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Cargo para un salón o todo el colegio
                    </DialogTitle>
                </DialogHeader>
                <Form
                    {...BillingController.storeBulkCharge.form()}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="grid gap-3"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-1">
                                <Label htmlFor="bulk-classroom">Para</Label>
                                <NativeSelect
                                    id="bulk-classroom"
                                    name="classroom_id"
                                    placeholder="Todo el colegio"
                                    options={classrooms}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="bulk-concept">Concepto</Label>
                                <NativeSelect
                                    id="bulk-concept"
                                    name="concept"
                                    defaultValue="otro"
                                    options={[
                                        {
                                            value: 'otro',
                                            label: 'Otro (materiales, uniforme, paseo…)',
                                        },
                                        {
                                            value: 'matricula',
                                            label: 'Matrícula',
                                        },
                                    ]}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="bulk-description">
                                    Descripción
                                </Label>
                                <Input
                                    id="bulk-description"
                                    name="description"
                                    placeholder="Materiales educativos 2026"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1">
                                    <Label htmlFor="bulk-amount">
                                        Monto (S/)
                                    </Label>
                                    <Input
                                        id="bulk-amount"
                                        name="amount"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                    />
                                    <InputError message={errors.amount} />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="bulk-due">Vence el</Label>
                                    <Input
                                        id="bulk-due"
                                        name="due_on"
                                        type="date"
                                    />
                                    <InputError message={errors.due_on} />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Se omite a quien ya tenga un cargo vigente con
                                la misma descripción.
                            </p>
                            <Button type="submit" disabled={processing}>
                                Agregar cargo
                            </Button>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

type Row = Charge & {
    student: { id: number; name: string };
    classroom: string;
};

type Props = {
    charges: Row[];
    stats: {
        collected_this_month: number;
        period_total: number;
        period_outstanding: number;
        pending_vouchers: number;
    };
    pendingPayments: PaymentRecord[];
    filters: {
        period: string;
        status: string;
        classroom: string;
        search: string;
    };
    classrooms: { value: number; label: string }[];
};

function Stat({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone?: string;
}) {
    return (
        <div className="rounded-2xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold tabular-nums ${tone ?? ''}`}>
                {value}
            </p>
        </div>
    );
}

export default function BillingIndex({
    charges,
    stats,
    pendingPayments,
    filters,
    classrooms,
}: Props) {
    const [search, setSearch] = useState(filters.search);

    function apply(next: Partial<Props['filters']>) {
        router.get(
            index.url(),
            { ...filters, search, ...next },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Pagos" />
            <div className="space-y-8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Pagos y pensiones"
                        description="Cuotas del mes, pagos registrados y vouchers por verificar."
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={debtors()}>
                                <AlertTriangle /> Morosos
                            </Link>
                        </Button>
                        <BulkChargeDialog classrooms={classrooms} />
                        <Button
                            onClick={() =>
                                router.post(
                                    generate.url(),
                                    { period: filters.period },
                                    { preserveScroll: true },
                                )
                            }
                        >
                            <CalendarPlus /> Generar mensualidades de{' '}
                            {filters.period}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                        label="Cobrado este mes"
                        value={money(stats.collected_this_month)}
                        tone="text-green-700"
                    />
                    <Stat
                        label={`Cuotas de ${filters.period}`}
                        value={money(stats.period_total)}
                    />
                    <Stat
                        label="Por cobrar del periodo"
                        value={money(stats.period_outstanding)}
                        tone="text-red-700"
                    />
                    <Stat
                        label="Vouchers por verificar"
                        value={String(stats.pending_vouchers)}
                        tone="text-amber-700"
                    />
                </div>

                {pendingPayments.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold">
                            Vouchers enviados por los padres
                        </h2>
                        <PaymentHistory
                            payments={pendingPayments}
                            actions={(payment) => (
                                <span className="ml-auto flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            router.post(
                                                confirmPayment.url(payment.id),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Check /> Confirmar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            const reason = prompt(
                                                'Motivo del rechazo (lo verá el padre):',
                                            );
                                            if (reason) {
                                                router.post(
                                                    rejectPayment.url(
                                                        payment.id,
                                                    ),
                                                    { reason },
                                                    { preserveScroll: true },
                                                );
                                            }
                                        }}
                                    >
                                        <X /> Rechazar
                                    </Button>
                                </span>
                            )}
                        />
                    </section>
                )}

                <section className="space-y-3">
                    <form
                        className="flex flex-wrap gap-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            apply({});
                        }}
                    >
                        <Input
                            type="month"
                            className="w-44"
                            value={filters.period}
                            onChange={(e) => apply({ period: e.target.value })}
                            aria-label="Periodo"
                        />
                        <NativeSelect
                            className="w-48"
                            value={filters.status}
                            placeholder="Todos los estados"
                            options={[
                                { value: 'pendiente', label: 'Pendiente' },
                                { value: 'vencida', label: 'Vencida' },
                                { value: 'parcial', label: 'Pago parcial' },
                                { value: 'pagada', label: 'Pagada' },
                            ]}
                            onChange={(e) => apply({ status: e.target.value })}
                        />
                        <NativeSelect
                            className="w-44"
                            value={filters.classroom}
                            placeholder="Todos los salones"
                            options={classrooms}
                            onChange={(e) =>
                                apply({ classroom: e.target.value })
                            }
                        />
                        <Input
                            className="max-w-56"
                            placeholder="Buscar alumno"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            <Search /> Buscar
                        </Button>
                    </form>

                    <div className="overflow-x-auto rounded-2xl border bg-card">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3 font-medium">Alumno</th>
                                    <th className="p-3 font-medium">
                                        Concepto
                                    </th>
                                    <th className="p-3 font-medium">Vence</th>
                                    <th className="p-3 text-right font-medium">
                                        Monto
                                    </th>
                                    <th className="p-3 text-right font-medium">
                                        Saldo
                                    </th>
                                    <th className="p-3 font-medium">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {charges.map((charge) => (
                                    <tr
                                        key={charge.id}
                                        className="hover:bg-accent"
                                    >
                                        <td className="p-3">
                                            <Link
                                                href={student(
                                                    charge.student.id,
                                                )}
                                                className="font-medium underline-offset-4 hover:underline"
                                            >
                                                {charge.student.name}
                                            </Link>
                                            <div className="text-muted-foreground">
                                                {charge.classroom}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            {charge.description}
                                        </td>
                                        <td className="p-3">
                                            {day(charge.due_on)}
                                        </td>
                                        <td className="p-3 text-right tabular-nums">
                                            {money(charge.amount)}
                                        </td>
                                        <td className="p-3 text-right font-medium tabular-nums">
                                            {money(charge.balance)}
                                        </td>
                                        <td className="p-3">
                                            <ChargeStatusBadge
                                                status={charge.status}
                                                daysLate={charge.days_late}
                                                pending={charge.pending}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {charges.length === 0 && (
                            <p className="p-8 text-center text-muted-foreground">
                                No hay cuotas para este periodo. Usa «Generar
                                mensualidades».
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

BillingIndex.layout = { breadcrumbs: [{ title: 'Pagos', href: index() }] };
