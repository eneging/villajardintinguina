import { money, monthName } from '@/components/billing/format';

export type MonthBalance = {
    month: string;
    tuition: number;
    other_income: number;
    income: number;
    payroll: number;
    expenses: number;
    outflow: number;
    result: number;
};

const monthLabel = (month: string) =>
    new Date(`${month}-01T00:00:00`)
        .toLocaleDateString('es-PE', { month: 'short' })
        .replace('.', '');

/**
 * Ingresos vs. egresos de los últimos 12 meses: barras agrupadas con tooltip por mes.
 * Dos series (azul/naranja validados para daltonismo); la tabla de abajo es la vista accesible.
 */
export function BalanceChart({ data }: { data: MonthBalance[] }) {
    const max = Math.max(1, ...data.flatMap((d) => [d.income, d.outflow]));
    const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));

    return (
        <figure
            className="space-y-3"
            aria-label="Ingresos y egresos de los últimos 12 meses"
        >
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                    <span className="size-3 rounded-sm bg-[var(--chart-income)]" />{' '}
                    Ingresos
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-3 rounded-sm bg-[var(--chart-outflow)]" />{' '}
                    Egresos
                </span>
            </div>
            <div className="relative h-56 pl-14">
                {ticks.map((tick) => (
                    <div
                        key={tick}
                        className="pointer-events-none absolute right-0 left-14 border-t border-border/60"
                        style={{ bottom: `${(tick / max) * 100}%` }}
                    >
                        <span className="absolute -top-2 -left-14 w-12 text-right text-[11px] text-muted-foreground tabular-nums">
                            {tick >= 1000
                                ? `${(tick / 1000).toFixed(1)} mil`
                                : tick}
                        </span>
                    </div>
                ))}
                <div className="absolute inset-0 left-14 flex items-end gap-1 border-b border-foreground/30">
                    {data.map((d) => (
                        <div
                            key={d.month}
                            className="group relative flex h-full flex-1 items-end justify-center gap-[2px] rounded-sm hover:bg-muted/50"
                            tabIndex={0}
                        >
                            <div
                                className="w-[38%] max-w-5 rounded-t-[4px] bg-[var(--chart-income)]"
                                style={{ height: `${(d.income / max) * 100}%` }}
                            />
                            <div
                                className="w-[38%] max-w-5 rounded-t-[4px] bg-[var(--chart-outflow)]"
                                style={{
                                    height: `${(d.outflow / max) * 100}%`,
                                }}
                            />
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-44 -translate-x-1/2 rounded-lg border bg-popover p-2 text-xs shadow-md group-hover:block group-focus:block">
                                <p className="font-semibold">
                                    {monthName(d.month)}
                                </p>
                                <p className="flex justify-between gap-2">
                                    <span className="flex items-center gap-1">
                                        <span className="size-2 rounded-sm bg-[var(--chart-income)]" />{' '}
                                        Ingresos
                                    </span>
                                    <span className="tabular-nums">
                                        {money(d.income)}
                                    </span>
                                </p>
                                <p className="flex justify-between gap-2">
                                    <span className="flex items-center gap-1">
                                        <span className="size-2 rounded-sm bg-[var(--chart-outflow)]" />{' '}
                                        Egresos
                                    </span>
                                    <span className="tabular-nums">
                                        {money(d.outflow)}
                                    </span>
                                </p>
                                <p className="mt-1 flex justify-between gap-2 border-t pt-1 font-semibold">
                                    <span>Resultado</span>
                                    <span className="tabular-nums">
                                        {money(d.result)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex gap-1 pl-14 text-center text-[11px] text-muted-foreground capitalize">
                {data.map((d) => (
                    <span key={d.month} className="flex-1">
                        {monthLabel(d.month)}
                    </span>
                ))}
            </div>
        </figure>
    );
}
