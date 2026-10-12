import { Head, Link } from '@inertiajs/react';
import { money, monthName } from '@/components/billing/format';
import Heading from '@/components/heading';
import { index, show } from '@/routes/payslips';

type Item = { id: number; period: string; net: number; paid_on: string | null };

export default function MyPayslips({ items }: { items: Item[] }) {
    return (
        <>
            <Head title="Mis boletas" />
            <div className="mx-auto w-full max-w-xl space-y-6 p-4">
                <Heading title="Mis boletas de pago" />
                <ul className="divide-y rounded-2xl border bg-card">
                    {items.map((item) => (
                        <li key={item.id}>
                            <Link
                                href={show(item.id)}
                                className="flex items-center justify-between gap-2 p-4 hover:bg-accent"
                            >
                                <span className="font-medium">
                                    {monthName(item.period)}
                                </span>
                                <span className="tabular-nums">
                                    {money(item.net)}
                                </span>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs ${item.paid_on ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
                                >
                                    {item.paid_on ? 'Pagado' : 'Por pagar'}
                                </span>
                            </Link>
                        </li>
                    ))}
                    {items.length === 0 && (
                        <li className="p-6 text-center text-muted-foreground">
                            Aún no tienes boletas.
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
}

MyPayslips.layout = { breadcrumbs: [{ title: 'Mis boletas', href: index() }] };
