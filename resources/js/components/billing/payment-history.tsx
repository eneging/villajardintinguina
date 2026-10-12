import { FileText, ImageIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { day, money } from '@/components/billing/format';
import type { MediaItem, PaymentRecord } from '@/types';

const statusLabels = {
    confirmed: { text: 'Confirmado', className: 'bg-green-100 text-green-800' },
    pending: {
        text: 'Por verificar',
        className: 'bg-amber-100 text-amber-800',
    },
    rejected: { text: 'Rechazado', className: 'bg-red-100 text-red-800' },
} as const;

function FileLink({ media, label }: { media: MediaItem; label: string }) {
    const Icon = media.format === 'pdf' ? FileText : ImageIcon;

    return (
        <a
            href={media.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
            <Icon className="size-4" /> {label}
        </a>
    );
}

export function PaymentHistory({
    payments,
    actions,
}: {
    payments: PaymentRecord[];
    actions?: (payment: PaymentRecord) => ReactNode;
}) {
    if (payments.length === 0) {
        return (
            <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Aún no hay pagos registrados.
            </p>
        );
    }

    return (
        <ul className="divide-y rounded-2xl border bg-card">
            {payments.map((payment) => (
                <li key={payment.id} className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">
                            {money(payment.amount)}{' '}
                            <span className="font-normal text-muted-foreground">
                                · {payment.method_label} ·{' '}
                                {day(payment.paid_on)}
                                {payment.operation_number &&
                                    ` · Op. ${payment.operation_number}`}
                            </span>
                        </span>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusLabels[payment.status].className}`}
                        >
                            {statusLabels[payment.status].text}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {payment.concepts.join(' · ')}
                        {payment.payer && ` — ${payment.payer}`}
                    </p>
                    {payment.rejection_reason && (
                        <p className="text-sm text-red-700">
                            Motivo: {payment.rejection_reason}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4">
                        {payment.receipt_number && (
                            <span className="text-sm">
                                {payment.receipt_type === 'factura'
                                    ? 'Factura'
                                    : 'Boleta'}{' '}
                                {payment.receipt_number}
                            </span>
                        )}
                        {payment.receipt && (
                            <FileLink
                                media={payment.receipt}
                                label="Ver comprobante"
                            />
                        )}
                        {payment.voucher && (
                            <FileLink
                                media={payment.voucher}
                                label="Ver voucher"
                            />
                        )}
                        {actions?.(payment)}
                    </div>
                </li>
            ))}
        </ul>
    );
}
