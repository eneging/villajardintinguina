import { Head } from '@inertiajs/react';
import { Wallet } from 'lucide-react';
import { useState } from 'react';
import PaymentController from '@/actions/App/Http/Controllers/Parent/PaymentController';
import { ChargeStatusBadge } from '@/components/billing/charge-status';
import { day, money } from '@/components/billing/format';
import { PaymentForm } from '@/components/billing/payment-form';
import { PaymentHistory } from '@/components/billing/payment-history';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/payments';
import type { Charge, Option, PaymentRecord } from '@/types';

type Props = {
    children: { id: number; name: string; charges: Charge[] }[];
    payments: PaymentRecord[];
    methods: Option[];
    cloudinaryEnabled: boolean;
};

export default function MyPayments({
    children,
    payments,
    methods,
    cloudinaryEnabled,
}: Props) {
    const [reporting, setReporting] = useState(false);
    const allCharges = children.flatMap((child) =>
        child.charges.map((charge) => ({
            ...charge,
            student: child.name.split(' ')[0],
        })),
    );
    const debt = allCharges.reduce(
        (sum, c) => sum + Math.max(0, c.balance - c.pending),
        0,
    );
    const overdue = allCharges.some((c) => c.status === 'vencida');

    return (
        <>
            <Head title="Mis pagos" />
            <div className="mx-auto w-full max-w-3xl space-y-8 p-4">
                <Heading
                    title="Mis pagos"
                    description="Pensiones de tus hijos, comprobantes y reporte de pagos."
                />

                <div
                    className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 ${overdue ? 'bg-red-50 text-red-950' : debt > 0 ? 'bg-amber-50 text-amber-950' : 'bg-green-50 text-green-950'}`}
                >
                    <div>
                        <p className="text-sm">
                            {debt > 0
                                ? overdue
                                    ? 'Tienes cuotas vencidas'
                                    : 'Por pagar'
                                : 'Estás al día 🎉'}
                        </p>
                        <p className="text-3xl font-bold tabular-nums">
                            {money(debt)}
                        </p>
                    </div>
                    {debt > 0 && (
                        <Button
                            size="lg"
                            onClick={() => setReporting((value) => !value)}
                        >
                            <Wallet /> Ya pagué: enviar voucher
                        </Button>
                    )}
                </div>

                {reporting && (
                    <section className="space-y-3 rounded-2xl border bg-card p-5">
                        <h2 className="text-lg font-semibold">Reportar pago</h2>
                        <p className="text-sm text-muted-foreground">
                            Paga por Yape, Plin o transferencia y sube la foto
                            del voucher. La administración lo verificará y te
                            dejará el comprobante aquí.
                        </p>
                        <PaymentForm
                            charges={allCharges}
                            methods={methods}
                            action={PaymentController.store()}
                            mode="parent"
                            cloudinaryEnabled={cloudinaryEnabled}
                            onDone={() => setReporting(false)}
                        />
                    </section>
                )}

                {children.map((child) => (
                    <section key={child.id} className="space-y-3">
                        <h2 className="text-lg font-semibold">{child.name}</h2>
                        {child.charges.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Sin cuotas registradas.
                            </p>
                        ) : (
                            <ul className="divide-y rounded-2xl border bg-card">
                                {child.charges.map((charge) => (
                                    <li
                                        key={charge.id}
                                        className="flex flex-wrap items-center justify-between gap-2 p-4"
                                    >
                                        <span>
                                            <span className="block font-medium">
                                                {charge.description}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                Vence {day(charge.due_on)}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-3">
                                            <span className="font-semibold tabular-nums">
                                                {money(
                                                    charge.balance > 0
                                                        ? charge.balance
                                                        : charge.amount,
                                                )}
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
                    </section>
                ))}

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                        Pagos y comprobantes
                    </h2>
                    <PaymentHistory payments={payments} />
                </section>
            </div>
        </>
    );
}

MyPayments.layout = { breadcrumbs: [{ title: 'Mis pagos', href: index() }] };
