import { Head, Link } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import { day } from '@/components/billing/format';
import { gradeTones } from '@/components/school/grades';
import Heading from '@/components/heading';
import { cn } from '@/lib/utils';
import { mine, show } from '@/routes/report-cards';
import type { GradingPeriodItem } from '@/types';

type Props = {
    children: {
        id: number;
        name: string;
        cards: { period: GradingPeriodItem; summary: Record<string, number> }[];
    }[];
};

export default function MyReportCards({ children }: Props) {
    return (
        <>
            <Head title="Libretas de notas" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <Heading
                    title="Libretas de notas"
                    description="Informe de progreso por competencias de cada bimestre o trimestre."
                />
                {children.map((child) => (
                    <section key={child.id} className="space-y-3">
                        <h2 className="text-lg font-semibold">{child.name}</h2>
                        {child.cards.length === 0 ? (
                            <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                Aún no hay libretas publicadas.
                            </p>
                        ) : (
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {child.cards.map((card) => (
                                    <li key={card.period.id}>
                                        <Link
                                            href={show([
                                                child.id,
                                                card.period.id,
                                            ])}
                                            className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:shadow-md"
                                        >
                                            <FileText className="size-8 text-green-700" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-semibold">
                                                    {card.period.name}
                                                </span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {day(card.period.starts_on)}{' '}
                                                    – {day(card.period.ends_on)}
                                                </span>
                                                <span className="mt-1 flex gap-1">
                                                    {['AD', 'A', 'B', 'C'].map(
                                                        (grade) =>
                                                            card.summary[
                                                                grade
                                                            ] ? (
                                                                <span
                                                                    key={grade}
                                                                    className={cn(
                                                                        'rounded px-1.5 text-xs font-bold',
                                                                        gradeTones[
                                                                            grade
                                                                        ],
                                                                    )}
                                                                >
                                                                    {grade} ×{' '}
                                                                    {
                                                                        card
                                                                            .summary[
                                                                            grade
                                                                        ]
                                                                    }
                                                                </span>
                                                            ) : null,
                                                    )}
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </div>
        </>
    );
}

MyReportCards.layout = {
    breadcrumbs: [{ title: 'Libretas de notas', href: mine() }],
};
