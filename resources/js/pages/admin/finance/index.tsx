import { Head, router, useForm } from '@inertiajs/react';
import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import FinanceController from '@/actions/App/Http/Controllers/Admin/FinanceController';
import { day, money } from '@/components/billing/format';
import { BalanceChart } from '@/components/finance/balance-chart';
import type { MonthBalance } from '@/components/finance/balance-chart';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { MediaUploader } from '@/components/school/media-uploader';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localToday } from '@/lib/school';
import { download, index } from '@/routes/admin/finance';
import { destroy as destroyExpense } from '@/routes/admin/finance/expenses';
import { destroy as destroyIncome } from '@/routes/admin/finance/incomes';
import type { MediaItem, Option } from '@/types';

type NumberOption = { value: number; label: string };

type Props = {
    month: string;
    balance: MonthBalance;
    history: MonthBalance[];
    expenses: {
        id: number;
        date: string;
        category: string;
        description: string;
        amount: number;
        method: string;
        receipt: MediaItem | null;
    }[];
    incomes: {
        id: number;
        date: string;
        source: string;
        description: string;
        amount: number;
    }[];
    categories: NumberOption[];
    sources: Option[];
    methods: Option[];
    cloudinaryEnabled: boolean;
};

function Tile({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail?: string;
}) {
    return (
        <div className="rounded-2xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {detail && (
                <p className="text-xs text-muted-foreground">{detail}</p>
            )}
        </div>
    );
}

export default function Finance({
    month,
    balance,
    history,
    expenses,
    incomes,
    categories,
    sources,
    methods,
    cloudinaryEnabled,
}: Props) {
    const [receipt, setReceipt] = useState<MediaItem | null>(null);
    const expenseForm = useForm({
        expense_category_id: categories[0]?.value ?? '',
        date: localToday(),
        description: '',
        amount: '',
        method: 'efectivo',
        receipt_media_id: null as number | null,
    });
    const incomeForm = useForm({
        date: localToday(),
        source: 'sorteo',
        description: '',
        amount: '',
    });

    return (
        <>
            <Head title="Finanzas" />
            <div className="space-y-8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Finanzas y balance"
                        description="Ingresos (pensiones confirmadas y otros) menos egresos (planilla pagada y gastos)."
                    />
                    <div className="flex gap-2">
                        <Input
                            type="month"
                            className="w-44"
                            value={month}
                            onChange={(e) =>
                                router.get(index.url(), { mes: e.target.value })
                            }
                            aria-label="Mes"
                        />
                        <Button variant="outline" asChild>
                            <a href={download.url({ query: { mes: month } })}>
                                <Download /> Excel
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Tile
                        label="Ingresos del mes"
                        value={money(balance.income)}
                        detail={`Pensiones ${money(balance.tuition)} · Otros ${money(balance.other_income)}`}
                    />
                    <Tile
                        label="Egresos del mes"
                        value={money(balance.outflow)}
                        detail={`Planilla ${money(balance.payroll)} · Gastos ${money(balance.expenses)}`}
                    />
                    <Tile
                        label={
                            balance.result >= 0
                                ? 'Resultado: ganancia'
                                : 'Resultado: pérdida'
                        }
                        value={money(balance.result)}
                    />
                </div>

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <h2 className="font-semibold">Últimos 12 meses</h2>
                    <BalanceChart data={history} />
                    <details>
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                            Ver tabla
                        </summary>
                        <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-muted-foreground">
                                    <tr>
                                        <th className="p-2 font-medium">Mes</th>
                                        <th className="p-2 text-right font-medium">
                                            Ingresos
                                        </th>
                                        <th className="p-2 text-right font-medium">
                                            Egresos
                                        </th>
                                        <th className="p-2 text-right font-medium">
                                            Resultado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {history.map((row) => (
                                        <tr key={row.month}>
                                            <td className="p-2">{row.month}</td>
                                            <td className="p-2 text-right tabular-nums">
                                                {money(row.income)}
                                            </td>
                                            <td className="p-2 text-right tabular-nums">
                                                {money(row.outflow)}
                                            </td>
                                            <td className="p-2 text-right font-medium tabular-nums">
                                                {money(row.result)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold">
                            Gastos del mes
                        </h2>
                        <form
                            className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                expenseForm.submit(
                                    FinanceController.storeExpense(),
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            expenseForm.reset(
                                                'description',
                                                'amount',
                                                'receipt_media_id',
                                            );
                                            setReceipt(null);
                                        },
                                    },
                                );
                            }}
                        >
                            <div className="grid gap-1">
                                <Label htmlFor="expense_category_id">
                                    Categoría
                                </Label>
                                <NativeSelect
                                    id="expense_category_id"
                                    value={expenseForm.data.expense_category_id}
                                    options={categories}
                                    onChange={(e) =>
                                        expenseForm.setData(
                                            'expense_category_id',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="expense_date">Fecha</Label>
                                <Input
                                    id="expense_date"
                                    type="date"
                                    value={expenseForm.data.date}
                                    onChange={(e) =>
                                        expenseForm.setData(
                                            'date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-1 sm:col-span-2">
                                <Label htmlFor="expense_description">
                                    Descripción
                                </Label>
                                <Input
                                    id="expense_description"
                                    value={expenseForm.data.description}
                                    onChange={(e) =>
                                        expenseForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={expenseForm.errors.description}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="expense_amount">
                                    Monto (S/)
                                </Label>
                                <Input
                                    id="expense_amount"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={expenseForm.data.amount}
                                    onChange={(e) =>
                                        expenseForm.setData(
                                            'amount',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={expenseForm.errors.amount}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="expense_method">
                                    Modalidad
                                </Label>
                                <NativeSelect
                                    id="expense_method"
                                    value={expenseForm.data.method}
                                    options={methods}
                                    onChange={(e) =>
                                        expenseForm.setData(
                                            'method',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                                <MediaUploader
                                    target={{ context: 'payment' }}
                                    resourceType="image"
                                    label={
                                        receipt
                                            ? 'Cambiar comprobante'
                                            : 'Foto del comprobante'
                                    }
                                    disabled={!cloudinaryEnabled}
                                    onUploaded={(media) => {
                                        setReceipt(media);
                                        expenseForm.setData(
                                            'receipt_media_id',
                                            media.id,
                                        );
                                    }}
                                />
                                <Button
                                    type="submit"
                                    className="ml-auto"
                                    disabled={expenseForm.processing}
                                >
                                    Registrar gasto
                                </Button>
                            </div>
                        </form>
                        <ul className="divide-y rounded-2xl border bg-card text-sm">
                            {expenses.map((expense) => (
                                <li
                                    key={expense.id}
                                    className="flex items-center gap-3 p-3"
                                >
                                    <span className="flex-1">
                                        <span className="block font-medium">
                                            {expense.description}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {expense.category} ·{' '}
                                            {day(expense.date)}
                                            {expense.receipt && (
                                                <>
                                                    {' · '}
                                                    <a
                                                        href={
                                                            expense.receipt.url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="underline"
                                                    >
                                                        comprobante
                                                    </a>
                                                </>
                                            )}
                                        </span>
                                    </span>
                                    <span className="tabular-nums">
                                        {money(expense.amount)}
                                    </span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Eliminar gasto"
                                        onClick={() =>
                                            confirm('¿Eliminar este gasto?') &&
                                            router.delete(
                                                destroyExpense.url(expense.id),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                </li>
                            ))}
                            {expenses.length === 0 && (
                                <li className="p-3 text-muted-foreground">
                                    Sin gastos este mes.
                                </li>
                            )}
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold">
                            Otros ingresos
                        </h2>
                        <form
                            className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                incomeForm.submit(
                                    FinanceController.storeIncome(),
                                    {
                                        preserveScroll: true,
                                        onSuccess: () =>
                                            incomeForm.reset(
                                                'description',
                                                'amount',
                                            ),
                                    },
                                );
                            }}
                        >
                            <div className="grid gap-1">
                                <Label htmlFor="income_source">Origen</Label>
                                <NativeSelect
                                    id="income_source"
                                    value={incomeForm.data.source}
                                    options={sources}
                                    onChange={(e) =>
                                        incomeForm.setData(
                                            'source',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="income_date">Fecha</Label>
                                <Input
                                    id="income_date"
                                    type="date"
                                    value={incomeForm.data.date}
                                    onChange={(e) =>
                                        incomeForm.setData(
                                            'date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-1 sm:col-span-2">
                                <Label htmlFor="income_description">
                                    Descripción
                                </Label>
                                <Input
                                    id="income_description"
                                    value={incomeForm.data.description}
                                    onChange={(e) =>
                                        incomeForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Sorteo Día de la Madre"
                                />
                                <InputError
                                    message={incomeForm.errors.description}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="income_amount">
                                    Monto (S/)
                                </Label>
                                <Input
                                    id="income_amount"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={incomeForm.data.amount}
                                    onChange={(e) =>
                                        incomeForm.setData(
                                            'amount',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={incomeForm.errors.amount}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="self-end"
                                disabled={incomeForm.processing}
                            >
                                Registrar ingreso
                            </Button>
                        </form>
                        <ul className="divide-y rounded-2xl border bg-card text-sm">
                            {incomes.map((income) => (
                                <li
                                    key={income.id}
                                    className="flex items-center gap-3 p-3"
                                >
                                    <span className="flex-1">
                                        <span className="block font-medium">
                                            {income.description}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {income.source} · {day(income.date)}
                                        </span>
                                    </span>
                                    <span className="tabular-nums">
                                        {money(income.amount)}
                                    </span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Eliminar ingreso"
                                        onClick={() =>
                                            confirm(
                                                '¿Eliminar este ingreso?',
                                            ) &&
                                            router.delete(
                                                destroyIncome.url(income.id),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                </li>
                            ))}
                            {incomes.length === 0 && (
                                <li className="p-3 text-muted-foreground">
                                    Sin otros ingresos este mes.
                                </li>
                            )}
                        </ul>
                    </section>
                </div>
            </div>
        </>
    );
}

Finance.layout = { breadcrumbs: [{ title: 'Finanzas', href: index() }] };
