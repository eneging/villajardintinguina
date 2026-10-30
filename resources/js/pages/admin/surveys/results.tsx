import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { index, results } from '@/routes/admin/surveys';
import type { SurveyQuestion } from '@/types';

type Result = SurveyQuestion & {
    answered: number;
    average: number | null;
    distribution: Record<string, number> | null;
    texts: { text: string; author: string | null }[];
};

type Props = {
    survey: {
        id: number;
        title: string;
        description: string | null;
        anonymous: boolean;
    };
    total: number;
    questions: Result[];
};

function Bars({ distribution }: { distribution: Record<string, number> }) {
    const max = Math.max(1, ...Object.values(distribution));

    return (
        <ul className="space-y-1.5">
            {Object.entries(distribution).map(([label, count]) => (
                <li
                    key={label}
                    className="grid grid-cols-[5rem_1fr_2.5rem] items-center gap-2 text-sm"
                >
                    <span className="truncate text-muted-foreground">
                        {label}
                    </span>
                    <span className="h-5 overflow-hidden rounded bg-muted">
                        <span
                            className="block h-full rounded bg-green-600"
                            style={{ width: `${(count / max) * 100}%` }}
                        />
                    </span>
                    <span className="text-right tabular-nums">{count}</span>
                </li>
            ))}
        </ul>
    );
}

export default function SurveyResults({ survey, total, questions }: Props) {
    return (
        <>
            <Head title={`Resultados · ${survey.title}`} />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <Heading
                    title={survey.title}
                    description={`${total} respuesta(s)${survey.anonymous ? ' · anónimas' : ''}`}
                />
                {questions.map((question) => (
                    <section
                        key={question.key}
                        className="space-y-3 rounded-2xl border bg-card p-5"
                    >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 className="font-semibold">{question.label}</h2>
                            <span className="text-xs text-muted-foreground">
                                {question.answered} respuesta(s)
                            </span>
                        </div>
                        {question.average !== null && (
                            <p className="text-3xl font-bold tabular-nums">
                                {question.average.toFixed(1)}{' '}
                                <span className="text-base font-normal text-muted-foreground">
                                    de 5
                                </span>
                            </p>
                        )}
                        {question.type === 'rating' &&
                            question.distribution && (
                                <Bars
                                    distribution={Object.fromEntries(
                                        Object.entries(
                                            question.distribution,
                                        ).map(([k, v]) => [
                                            `${'★'.repeat(Number(k))}`,
                                            v,
                                        ]),
                                    )}
                                />
                            )}
                        {question.type === 'choice' &&
                            question.distribution && (
                                <Bars distribution={question.distribution} />
                            )}
                        {question.type === 'text' && (
                            <ul className="space-y-2">
                                {question.texts.map((answer, i) => (
                                    <li
                                        key={i}
                                        className="rounded-xl bg-muted/50 p-3 text-sm"
                                    >
                                        “{answer.text}”
                                        {answer.author && (
                                            <span className="text-muted-foreground">
                                                {' '}
                                                — {answer.author}
                                            </span>
                                        )}
                                    </li>
                                ))}
                                {question.texts.length === 0 && (
                                    <li className="text-sm text-muted-foreground">
                                        Sin comentarios.
                                    </li>
                                )}
                            </ul>
                        )}
                    </section>
                ))}
            </div>
        </>
    );
}

SurveyResults.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Encuestas', href: index() },
        { title: 'Resultados', href: results(props.survey.id) },
    ],
});
