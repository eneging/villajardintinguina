import { Head, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { NativeSelect } from '@/components/school/native-select';
import { Pagination } from '@/components/school/pagination';
import type { Paginated } from '@/components/school/pagination';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { index } from '@/routes/admin/audit';
import type { Option } from '@/types';

type Values = Record<string, unknown> | null;

type LogRow = {
    id: number;
    event: 'created' | 'updated' | 'deleted';
    type: string;
    type_label: string;
    record_id: number;
    user: string | null;
    old: Values;
    new: Values;
    ip: string | null;
    at: string;
};

type Props = {
    logs: Paginated<LogRow>;
    types: Option[];
    filters: { type: string; event: string; from: string; to: string };
};

const events = {
    created: { label: 'Creó', tone: 'bg-green-100 text-green-800' },
    updated: { label: 'Modificó', tone: 'bg-amber-100 text-amber-800' },
    deleted: { label: 'Eliminó', tone: 'bg-red-100 text-red-800' },
};

const when = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function show(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    return typeof value === 'string' ? value : JSON.stringify(value);
}

function Changes({ log }: { log: LogRow }) {
    const keys = Object.keys(log.new ?? log.old ?? {}).filter(
        (key) => key !== 'id',
    );

    return (
        <dl className="grid gap-x-3 gap-y-0.5 text-xs sm:grid-cols-[10rem_1fr]">
            {keys.map((key) => (
                <div key={key} className="contents">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="break-all">
                        {log.event === 'updated' ? (
                            <>
                                <span className="text-red-700 line-through">
                                    {show(log.old?.[key])}
                                </span>{' '}
                                →{' '}
                                <span className="text-green-700">
                                    {show(log.new?.[key])}
                                </span>
                            </>
                        ) : (
                            show((log.new ?? log.old)?.[key])
                        )}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export default function AuditIndex({ logs, types, filters }: Props) {
    function apply(next: Partial<Props['filters']>) {
        router.get(
            index.url(),
            { ...filters, ...next },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Auditoría" />
            <div className="space-y-6 p-4">
                <Heading
                    title="Auditoría"
                    description="Quién registró, cambió o eliminó pagos, cuotas, planilla, gastos, matrículas y reclamos. Este historial no se puede editar."
                />
                <div className="flex flex-wrap gap-2">
                    <NativeSelect
                        className="w-48"
                        value={filters.type}
                        placeholder="Todo"
                        options={types}
                        onChange={(e) => apply({ type: e.target.value })}
                    />
                    <NativeSelect
                        className="w-40"
                        value={filters.event}
                        placeholder="Cualquier acción"
                        options={Object.entries(events).map(([value, e]) => ({
                            value,
                            label: e.label,
                        }))}
                        onChange={(e) => apply({ event: e.target.value })}
                    />
                    <Input
                        type="date"
                        className="w-40"
                        aria-label="Desde"
                        value={filters.from}
                        onChange={(e) => apply({ from: e.target.value })}
                    />
                    <Input
                        type="date"
                        className="w-40"
                        aria-label="Hasta"
                        value={filters.to}
                        onChange={(e) => apply({ to: e.target.value })}
                    />
                </div>
                <ul className="space-y-2">
                    {logs.data.map((log) => (
                        <li key={log.id} className="rounded-2xl border bg-card">
                            <details>
                                <summary className="flex cursor-pointer flex-wrap items-center gap-2 p-3 text-sm">
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-xs font-medium',
                                            events[log.event].tone,
                                        )}
                                    >
                                        {events[log.event].label}
                                    </span>
                                    <span className="font-medium">
                                        {log.type_label} #{log.record_id}
                                    </span>
                                    <span className="text-muted-foreground">
                                        · {log.user ?? 'Sistema'} ·{' '}
                                        {when.format(new Date(log.at))}
                                        {log.ip && ` · IP ${log.ip}`}
                                    </span>
                                </summary>
                                <div className="border-t p-3">
                                    <Changes log={log} />
                                </div>
                            </details>
                        </li>
                    ))}
                </ul>
                {logs.data.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Sin movimientos con estos filtros.
                    </p>
                )}
                <Pagination page={logs} />
            </div>
        </>
    );
}

AuditIndex.layout = {
    breadcrumbs: [{ title: 'Auditoría', href: index() }],
};
