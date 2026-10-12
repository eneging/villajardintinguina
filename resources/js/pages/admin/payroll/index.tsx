import { Head, Link, useForm } from '@inertiajs/react';
import { Calculator, Users } from 'lucide-react';
import PayrollController from '@/actions/App/Http/Controllers/Admin/PayrollController';
import { money } from '@/components/billing/format';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { index as employees } from '@/routes/admin/employees';
import { index, show } from '@/routes/admin/payroll';

type Run = {
    id: number;
    period: string;
    status: 'borrador' | 'aprobada' | 'pagada';
    total_net: number;
    items_count: number;
};

export const runStatus = {
    borrador: { text: 'Borrador', className: 'bg-slate-100 text-slate-700' },
    aprobada: {
        text: 'Aprobada · por pagar',
        className: 'bg-amber-100 text-amber-800',
    },
    pagada: { text: 'Pagada', className: 'bg-green-100 text-green-800' },
} as const;

export default function PayrollIndex({
    runs,
    currentPeriod,
}: {
    runs: Run[];
    currentPeriod: string;
}) {
    const form = useForm({ period: currentPeriod });

    return (
        <>
            <Head title="Planilla" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Planilla"
                        description="Se calcula con el sueldo, la asistencia del mes y las retenciones. Revisa, ajusta y aprueba."
                    />
                    <Button variant="outline" asChild>
                        <Link href={employees()}>
                            <Users /> Trabajadores
                        </Link>
                    </Button>
                </div>

                <form
                    className="flex flex-wrap items-end gap-2 rounded-2xl border bg-card p-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.submit(PayrollController.generate());
                    }}
                >
                    <div className="grid gap-1">
                        <label htmlFor="period" className="text-sm font-medium">
                            Mes
                        </label>
                        <Input
                            id="period"
                            type="month"
                            className="w-44"
                            value={form.data.period}
                            onChange={(e) =>
                                form.setData('period', e.target.value)
                            }
                        />
                    </div>
                    <Button type="submit" disabled={form.processing}>
                        <Calculator /> Calcular planilla
                    </Button>
                    <InputError
                        message={form.errors.period}
                        className="w-full"
                    />
                </form>

                <ul className="divide-y rounded-2xl border bg-card">
                    {runs.map((run) => (
                        <li key={run.id}>
                            <Link
                                href={show(run.id)}
                                className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-accent"
                            >
                                <span className="font-semibold">
                                    {run.period}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {run.items_count} trabajadores
                                </span>
                                <span className="font-medium tabular-nums">
                                    {money(run.total_net)}
                                </span>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${runStatus[run.status].className}`}
                                >
                                    {runStatus[run.status].text}
                                </span>
                            </Link>
                        </li>
                    ))}
                    {runs.length === 0 && (
                        <li className="p-6 text-center text-muted-foreground">
                            Aún no hay planillas. Registra a tus trabajadores y
                            calcula la del mes.
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
}

PayrollIndex.layout = { breadcrumbs: [{ title: 'Planilla', href: index() }] };
