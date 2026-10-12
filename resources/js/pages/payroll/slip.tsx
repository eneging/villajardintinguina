import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { day, money, monthName } from '@/components/billing/format';
import { Button } from '@/components/ui/button';

type Props = {
    item: {
        employee: {
            name: string;
            dni: string | null;
            position: string;
            regime: string;
            bank: string | null;
            account_number: string | null;
        };
        base_salary: number;
        absences: number;
        absence_deduction: number;
        late_minutes: number;
        late_deduction: number;
        bonuses: number;
        other_deductions: number;
        retention_label: string | null;
        retention: number;
        net: number;
        paid_on: string | null;
        payment_method: string | null;
        notes: string | null;
    };
    period: string;
    school: { name: string; legal_name: string; ruc: string };
};

function Line({
    label,
    value,
    strong,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div
            className={`flex justify-between gap-4 py-1 ${strong ? 'border-t pt-2 text-lg font-bold' : ''}`}
        >
            <span>{label}</span>
            <span className="tabular-nums">{value}</span>
        </div>
    );
}

export default function PayslipPage({ item, period, school }: Props) {
    const month = monthName(period);

    return (
        <>
            <Head title={`Boleta ${period}`} />
            <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
                <div className="flex justify-end print:hidden">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer /> Imprimir o guardar PDF
                    </Button>
                </div>
                <article className="space-y-5 rounded-2xl border bg-white p-6 text-slate-800 print:border-0">
                    <header className="flex flex-wrap justify-between gap-2 border-b pb-3">
                        <div>
                            <p className="font-bold">{school.legal_name}</p>
                            <p className="text-sm">
                                RUC {school.ruc} · {school.name}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">Boleta de pago</p>
                            <p className="text-sm">{month}</p>
                        </div>
                    </header>
                    <div className="grid gap-1 text-sm sm:grid-cols-2">
                        <p>
                            <strong>Trabajador:</strong> {item.employee.name}
                        </p>
                        {item.employee.dni && (
                            <p>
                                <strong>DNI:</strong> {item.employee.dni}
                            </p>
                        )}
                        <p>
                            <strong>Cargo:</strong> {item.employee.position}
                        </p>
                        <p>
                            <strong>Régimen:</strong> {item.employee.regime}
                        </p>
                    </div>
                    <div className="text-sm">
                        <Line
                            label="Remuneración"
                            value={money(item.base_salary)}
                        />
                        {item.bonuses > 0 && (
                            <Line
                                label="Bonos"
                                value={`+ ${money(item.bonuses)}`}
                            />
                        )}
                        {item.absence_deduction > 0 && (
                            <Line
                                label={`Descuento por ${item.absences} falta(s)`}
                                value={`− ${money(item.absence_deduction)}`}
                            />
                        )}
                        {item.late_deduction > 0 && (
                            <Line
                                label={`Descuento por tardanzas (${item.late_minutes} min)`}
                                value={`− ${money(item.late_deduction)}`}
                            />
                        )}
                        {item.other_deductions > 0 && (
                            <Line
                                label="Otros descuentos"
                                value={`− ${money(item.other_deductions)}`}
                            />
                        )}
                        {item.retention > 0 && (
                            <Line
                                label={item.retention_label ?? 'Retención'}
                                value={`− ${money(item.retention)}`}
                            />
                        )}
                        <Line
                            label="Neto pagado"
                            value={money(item.net)}
                            strong
                        />
                    </div>
                    {item.notes && (
                        <p className="text-sm text-slate-600">
                            Nota: {item.notes}
                        </p>
                    )}
                    <p className="text-sm text-slate-600">
                        {item.paid_on
                            ? `Pagado el ${day(item.paid_on)} por ${item.payment_method}`
                            : 'Pendiente de pago'}
                        {item.employee.bank &&
                            ` · ${item.employee.bank} ${item.employee.account_number ?? ''}`}
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-10 text-center text-xs">
                        <p className="border-t pt-1">Empleador</p>
                        <p className="border-t pt-1">Trabajador</p>
                    </div>
                </article>
            </div>
        </>
    );
}
