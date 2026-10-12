import { Head, router, useForm } from '@inertiajs/react';
import { Ban } from 'lucide-react';
import BillingController from '@/actions/App/Http/Controllers/Admin/BillingController';
import { ChargeStatusBadge } from '@/components/billing/charge-status';
import { day, money } from '@/components/billing/format';
import { PaymentForm } from '@/components/billing/payment-form';
import { PaymentHistory } from '@/components/billing/payment-history';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localToday } from '@/lib/school';
import { index, student as studentRoute } from '@/routes/admin/billing';
import { annul as annulCharge } from '@/routes/admin/billing/charges';
import type { Charge, Option, PaymentRecord } from '@/types';

type Props = {
    student: {
        id: number;
        name: string;
        classroom: string | null;
        enrollment_id: number | null;
        guardians: {
            id: number;
            name: string;
            phone: string | null;
            is_billing_contact: boolean;
        }[];
    };
    charges: Charge[];
    payments: PaymentRecord[];
    methods: Option[];
    concepts: Option[];
    cloudinaryEnabled: boolean;
};

export default function BillingStudent({
    student,
    charges,
    payments,
    methods,
    concepts,
    cloudinaryEnabled,
}: Props) {
    const debt = charges
        .filter((c) => c.status !== 'anulada')
        .reduce((sum, c) => sum + Math.max(0, c.balance), 0);
    const chargeForm = useForm({
        concept: 'matricula',
        description: '',
        amount: '',
        due_on: localToday(),
    });

    return (
        <>
            <Head title={`Pagos · ${student.name}`} />
            <div className="mx-auto w-full max-w-4xl space-y-8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={student.name}
                        description={`${student.classroom ?? 'Sin matrícula'} · Apoderados: ${student.guardians.map((g) => `${g.name}${g.is_billing_contact ? ' (pagos)' : ''}`).join(', ') || '—'}`}
                    />
                    <div className="rounded-2xl border bg-card px-4 py-2 text-right">
                        <p className="text-sm text-muted-foreground">
                            Deuda total
                        </p>
                        <p
                            className={`text-2xl font-bold tabular-nums ${debt > 0 ? 'text-red-700' : 'text-green-700'}`}
                        >
                            {money(debt)}
                        </p>
                    </div>
                </div>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Cuotas</h2>
                    <div className="overflow-x-auto rounded-2xl border bg-card">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3 font-medium">
                                        Concepto
                                    </th>
                                    <th className="p-3 font-medium">Vence</th>
                                    <th className="p-3 text-right font-medium">
                                        Monto
                                    </th>
                                    <th className="p-3 text-right font-medium">
                                        Pagado
                                    </th>
                                    <th className="p-3 font-medium">Estado</th>
                                    <th className="p-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {charges.map((charge) => (
                                    <tr key={charge.id}>
                                        <td className="p-3">
                                            {charge.description}
                                        </td>
                                        <td className="p-3">
                                            {day(charge.due_on)}
                                        </td>
                                        <td className="p-3 text-right tabular-nums">
                                            {money(charge.amount)}
                                        </td>
                                        <td className="p-3 text-right tabular-nums">
                                            {money(charge.paid)}
                                        </td>
                                        <td className="p-3">
                                            <ChargeStatusBadge
                                                status={charge.status}
                                                daysLate={charge.days_late}
                                                pending={charge.pending}
                                            />
                                        </td>
                                        <td className="p-3 text-right">
                                            {charge.paid === 0 &&
                                                charge.pending === 0 &&
                                                charge.status !== 'anulada' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    '¿Anular esta cuota?',
                                                                )
                                                            ) {
                                                                router.post(
                                                                    annulCharge.url(
                                                                        charge.id,
                                                                    ),
                                                                    {},
                                                                    {
                                                                        preserveScroll: true,
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <Ban /> Anular
                                                    </Button>
                                                )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {student.enrollment_id && (
                        <form
                            className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[10rem_1fr_8rem_10rem_auto] sm:items-end"
                            onSubmit={(event) => {
                                event.preventDefault();
                                chargeForm.submit(
                                    BillingController.storeCharge(student.id),
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => chargeForm.reset(),
                                    },
                                );
                            }}
                        >
                            <div className="grid gap-1">
                                <Label htmlFor="concept">Nueva cuota</Label>
                                <NativeSelect
                                    id="concept"
                                    value={chargeForm.data.concept}
                                    options={concepts}
                                    onChange={(e) =>
                                        chargeForm.setData(
                                            'concept',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="description">Descripción</Label>
                                <Input
                                    id="description"
                                    placeholder="Matrícula 2026, uniforme, paseo…"
                                    value={chargeForm.data.description}
                                    onChange={(e) =>
                                        chargeForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={chargeForm.errors.description}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="charge_amount">Monto</Label>
                                <Input
                                    id="charge_amount"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={chargeForm.data.amount}
                                    onChange={(e) =>
                                        chargeForm.setData(
                                            'amount',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={chargeForm.errors.amount}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="due_on">Vence</Label>
                                <Input
                                    id="due_on"
                                    type="date"
                                    value={chargeForm.data.due_on}
                                    onChange={(e) =>
                                        chargeForm.setData(
                                            'due_on',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                disabled={chargeForm.processing}
                            >
                                Agregar
                            </Button>
                        </form>
                    )}
                </section>

                <section className="space-y-3 rounded-2xl border bg-card p-5">
                    <h2 className="text-lg font-semibold">Registrar pago</h2>
                    <PaymentForm
                        charges={charges}
                        methods={methods}
                        action={BillingController.storePayment()}
                        mode="admin"
                        cloudinaryEnabled={cloudinaryEnabled}
                    />
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                        Historial de pagos
                    </h2>
                    <PaymentHistory payments={payments} />
                </section>
            </div>
        </>
    );
}

BillingStudent.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Pagos', href: index() },
        { title: props.student.name, href: studentRoute(props.student.id) },
    ],
});
