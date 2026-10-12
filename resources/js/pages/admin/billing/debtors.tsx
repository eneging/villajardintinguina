import { Head, Link, router } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import { day, money } from '@/components/billing/format';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    debtors as debtorsRoute,
    index,
    remind,
    student,
} from '@/routes/admin/billing';

type Debtor = {
    contact: { id: number; name: string; phone: string | null } | null;
    total: number;
    max_days_late: number;
    last_reminder_at: string | null;
    charges: {
        id: number;
        description: string;
        student: { id: number; name: string };
        balance: number;
        due_on: string;
        days_late: number;
    }[];
};

function whatsappLink(debtor: Debtor, school: string): string | null {
    const digits = debtor.contact?.phone?.replace(/\D/g, '') ?? '';

    if (digits.length < 9) {
        return null;
    }

    const phone = digits.length === 9 ? `51${digits}` : digits;
    const detail = debtor.charges
        .map(
            (c) =>
                `• ${c.description} (${c.student.name.split(' ')[0]}): ${money(c.balance)}`,
        )
        .join('\n');
    const text = `Hola ${debtor.contact?.name.split(' ')[0]}, le saludamos de ${school}. Le recordamos que tiene pendiente:\n${detail}\nTotal: ${money(debtor.total)}.\nPuede pagar por Yape, transferencia o en efectivo y enviar su voucher desde la plataforma. ¡Gracias!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default function Debtors({
    debtors,
    school,
}: {
    debtors: Debtor[];
    school: string;
}) {
    const total = debtors.reduce((sum, d) => sum + d.total, 0);

    return (
        <>
            <Head title="Morosos" />
            <div className="space-y-6 p-4">
                <Heading
                    title="Morosos"
                    description={`${debtors.length} familia${debtors.length === 1 ? '' : 's'} con cuotas vencidas · ${money(total)} por cobrar.`}
                />

                {debtors.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        🎉 No hay cuotas vencidas.
                    </p>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                    {debtors.map((debtor) => {
                        const link = whatsappLink(debtor, school);

                        return (
                            <article
                                key={debtor.contact?.id ?? 'sin-apoderado'}
                                className="space-y-3 rounded-2xl border bg-card p-5"
                            >
                                <header className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <h2 className="font-semibold">
                                            {debtor.contact?.name ??
                                                'Sin apoderado registrado'}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {debtor.contact?.phone ??
                                                'Sin celular'}{' '}
                                            · hasta {debtor.max_days_late} días
                                            de atraso
                                        </p>
                                    </div>
                                    <p className="text-xl font-bold text-red-700 tabular-nums">
                                        {money(debtor.total)}
                                    </p>
                                </header>
                                <ul className="space-y-1 text-sm">
                                    {debtor.charges.map((charge) => (
                                        <li
                                            key={charge.id}
                                            className="flex justify-between gap-2"
                                        >
                                            <Link
                                                href={student(
                                                    charge.student.id,
                                                )}
                                                className="underline-offset-4 hover:underline"
                                            >
                                                {charge.description} —{' '}
                                                {charge.student.name}
                                            </Link>
                                            <span className="tabular-nums">
                                                {money(charge.balance)}{' '}
                                                <span className="text-muted-foreground">
                                                    · {day(charge.due_on)}
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <footer className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                                    <span className="text-xs text-muted-foreground">
                                        {debtor.last_reminder_at
                                            ? `Último recordatorio: ${day(debtor.last_reminder_at)}`
                                            : 'Aún sin recordatorio'}
                                    </span>
                                    {link && debtor.contact && (
                                        <Button
                                            size="sm"
                                            className="bg-[#25d366] text-white hover:bg-[#1fb855]"
                                            onClick={() => {
                                                window.open(
                                                    link,
                                                    '_blank',
                                                    'noopener',
                                                );
                                                router.post(
                                                    remind.url(
                                                        debtor.contact!.id,
                                                    ),
                                                    {
                                                        total: debtor.total,
                                                        charge_ids:
                                                            debtor.charges.map(
                                                                (c) => c.id,
                                                            ),
                                                    },
                                                    { preserveScroll: true },
                                                );
                                            }}
                                        >
                                            <MessageCircle /> Recordar por
                                            WhatsApp
                                        </Button>
                                    )}
                                </footer>
                            </article>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

Debtors.layout = {
    breadcrumbs: [
        { title: 'Pagos', href: index() },
        { title: 'Morosos', href: debtorsRoute() },
    ],
};
