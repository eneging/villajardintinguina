import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, FileText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import PayrollController from '@/actions/App/Http/Controllers/Admin/PayrollController';
import { day, money } from '@/components/billing/format';
import Heading from '@/components/heading';
import { MediaUploader } from '@/components/school/media-uploader';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localToday } from '@/lib/school';
import { runStatus } from '@/pages/admin/payroll/index';
import { generate, index, show } from '@/routes/admin/payroll';
import { slip } from '@/routes/admin/payroll/items';
import type { MediaItem, Option } from '@/types';

type Item = {
    id: number;
    employee: {
        id: number;
        name: string;
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
    voucher: MediaItem | null;
    notes: string | null;
};

type Props = {
    run: {
        id: number;
        period: string;
        status: 'borrador' | 'aprobada' | 'pagada';
        total_net: number;
        approved_by: string | null;
    };
    items: Item[];
    methods: Option[];
    lateRate: number;
    cloudinaryEnabled: boolean;
};

function DraftRow({ item }: { item: Item }) {
    const [values, setValues] = useState({
        bonuses: item.bonuses,
        other_deductions: item.other_deductions,
        absences: item.absences,
        notes: item.notes ?? '',
    });
    const save = () =>
        router.put(PayrollController.updateItem.url(item.id), values, {
            preserveScroll: true,
        });

    return (
        <div className="grid gap-2 sm:grid-cols-4">
            <label className="grid gap-1 text-xs text-muted-foreground">
                Faltas injustificadas
                <Input
                    type="number"
                    min={0}
                    value={values.absences}
                    onChange={(e) =>
                        setValues({
                            ...values,
                            absences: Number(e.target.value),
                        })
                    }
                    onBlur={save}
                />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
                Bonos (S/)
                <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={values.bonuses}
                    onChange={(e) =>
                        setValues({
                            ...values,
                            bonuses: Number(e.target.value),
                        })
                    }
                    onBlur={save}
                />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
                Otros descuentos (S/)
                <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={values.other_deductions}
                    onChange={(e) =>
                        setValues({
                            ...values,
                            other_deductions: Number(e.target.value),
                        })
                    }
                    onBlur={save}
                />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
                Nota
                <Input
                    value={values.notes}
                    onChange={(e) =>
                        setValues({ ...values, notes: e.target.value })
                    }
                    onBlur={save}
                    placeholder="Adelanto, bono…"
                />
            </label>
        </div>
    );
}

function PayForm({
    item,
    methods,
    cloudinaryEnabled,
}: {
    item: Item;
    methods: Option[];
    cloudinaryEnabled: boolean;
}) {
    const form = useForm({
        paid_on: localToday(),
        payment_method: 'transferencia',
        operation_number: '',
        voucher_media_id: null as number | null,
    });
    const [voucher, setVoucher] = useState<MediaItem | null>(null);

    return (
        <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
                event.preventDefault();
                form.submit(PayrollController.pay(item.id), {
                    preserveScroll: true,
                });
            }}
        >
            <Input
                type="date"
                className="w-40"
                value={form.data.paid_on}
                onChange={(e) => form.setData('paid_on', e.target.value)}
                aria-label="Fecha de pago"
            />
            <NativeSelect
                className="w-40"
                value={form.data.payment_method}
                options={methods}
                onChange={(e) => form.setData('payment_method', e.target.value)}
                aria-label="Modalidad"
            />
            <Input
                className="w-40"
                placeholder="N° operación"
                value={form.data.operation_number}
                onChange={(e) =>
                    form.setData('operation_number', e.target.value)
                }
            />
            <MediaUploader
                target={{ context: 'payment' }}
                resourceType="image"
                label={voucher ? 'Voucher listo ✓' : 'Voucher'}
                disabled={!cloudinaryEnabled}
                onUploaded={(media) => {
                    setVoucher(media);
                    form.setData('voucher_media_id', media.id);
                }}
            />
            <Button type="submit" size="sm" disabled={form.processing}>
                Registrar pago
            </Button>
        </form>
    );
}

export default function PayrollShow({
    run,
    items,
    methods,
    lateRate,
    cloudinaryEnabled,
}: Props) {
    const draft = run.status === 'borrador';

    return (
        <>
            <Head title={`Planilla ${run.period}`} />
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title={`Planilla ${run.period}`}
                        description={`Faltas tomadas de la asistencia (sueldo ÷ 30 por día). ${lateRate > 0 ? `Tardanza: S/ ${lateRate} por minuto.` : 'Las tardanzas no se descuentan.'} Retenciones referenciales: confírmalas con tu contador.`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${runStatus[run.status].className}`}
                        >
                            {runStatus[run.status].text}
                        </span>
                        {draft && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.post(generate.url(), {
                                            period: run.period,
                                        })
                                    }
                                >
                                    <RefreshCw /> Recalcular
                                </Button>
                                <Button
                                    onClick={() =>
                                        confirm(
                                            'Al aprobar ya no se podrá modificar la planilla. ¿Continuar?',
                                        ) &&
                                        router.post(
                                            PayrollController.approve.url(
                                                run.id,
                                            ),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <CheckCircle2 /> Aprobar
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <ul className="space-y-3">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className="space-y-3 rounded-2xl border bg-card p-4"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p className="font-semibold">
                                        {item.employee.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.employee.position} ·{' '}
                                        {item.employee.regime}
                                        {item.employee.bank &&
                                            ` · ${item.employee.bank} ${item.employee.account_number ?? ''}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">
                                        Neto a pagar
                                    </p>
                                    <p className="text-xl font-bold tabular-nums">
                                        {money(item.net)}
                                    </p>
                                </div>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-6">
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Sueldo
                                    </dt>
                                    <dd className="tabular-nums">
                                        {money(item.base_salary)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Faltas ({item.absences})
                                    </dt>
                                    <dd className="tabular-nums">
                                        −{money(item.absence_deduction)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Tardanzas ({item.late_minutes} min)
                                    </dt>
                                    <dd className="tabular-nums">
                                        −{money(item.late_deduction)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Bonos
                                    </dt>
                                    <dd className="tabular-nums">
                                        +{money(item.bonuses)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Otros descuentos
                                    </dt>
                                    <dd className="tabular-nums">
                                        −{money(item.other_deductions)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        {item.retention_label ?? 'Retención'}
                                    </dt>
                                    <dd className="tabular-nums">
                                        −{money(item.retention)}
                                    </dd>
                                </div>
                            </dl>

                            {draft && <DraftRow item={item} />}
                            {!draft && !item.paid_on && (
                                <PayForm
                                    item={item}
                                    methods={methods}
                                    cloudinaryEnabled={cloudinaryEnabled}
                                />
                            )}
                            {item.paid_on && (
                                <p className="flex flex-wrap items-center gap-3 text-sm text-green-800">
                                    <CheckCircle2 className="size-4" /> Pagado
                                    el {day(item.paid_on)} (
                                    {item.payment_method})
                                    {item.voucher && (
                                        <a
                                            href={item.voucher.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline"
                                        >
                                            ver voucher
                                        </a>
                                    )}
                                </p>
                            )}
                            {!draft && (
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={slip(item.id)}>
                                        <FileText /> Boleta de pago
                                    </Link>
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="flex justify-end rounded-2xl border bg-card p-4">
                    <p className="text-lg">
                        Total planilla:{' '}
                        <strong className="tabular-nums">
                            {money(run.total_net)}
                        </strong>
                    </p>
                </div>
            </div>
        </>
    );
}

PayrollShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Planilla', href: index() },
        { title: props.run.period, href: show(props.run.id) },
    ],
});
