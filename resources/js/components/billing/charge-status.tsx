import { cn } from '@/lib/utils';
import type { ChargeStatus } from '@/types';

const styles: Record<ChargeStatus, string> = {
    pagada: 'bg-green-100 text-green-800',
    parcial: 'bg-sky-100 text-sky-800',
    pendiente: 'bg-slate-100 text-slate-700',
    vencida: 'bg-red-100 text-red-800',
    anulada: 'bg-slate-100 text-slate-400 line-through',
};

const labels: Record<ChargeStatus, string> = {
    pagada: 'Pagada',
    parcial: 'Pago parcial',
    pendiente: 'Pendiente',
    vencida: 'Vencida',
    anulada: 'Anulada',
};

export function ChargeStatusBadge({
    status,
    daysLate = 0,
    pending = 0,
}: {
    status: ChargeStatus;
    daysLate?: number;
    pending?: number;
}) {
    return (
        <span className="inline-flex flex-wrap items-center gap-1">
            <span
                className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    styles[status],
                )}
            >
                {labels[status]}
                {status === 'vencida' && daysLate > 0 && ` · ${daysLate} d`}
            </span>
            {pending > 0 && status !== 'pagada' && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    Voucher por verificar
                </span>
            )}
        </span>
    );
}
