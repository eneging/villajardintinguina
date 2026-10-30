import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { day } from '@/components/billing/format';
import Heading from '@/components/heading';
import { index, show } from '@/routes/surveys';

type Row = {
    id: number;
    title: string;
    description: string | null;
    closes_on: string | null;
    open: boolean;
    answered: boolean;
    questions_count: number;
};

export default function Surveys({ surveys }: { surveys: Row[] }) {
    return (
        <>
            <Head title="Encuestas" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <Heading
                    title="Encuestas"
                    description="Cuéntanos qué te parece el colegio. Toma menos de 2 minutos."
                />
                <ul className="space-y-3">
                    {surveys.map((survey) => (
                        <li key={survey.id}>
                            <Link
                                href={show(survey.id)}
                                className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:shadow-md"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold">
                                        {survey.title}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {survey.questions_count} preguntas
                                        {survey.closes_on &&
                                            ` · hasta el ${day(survey.closes_on)}`}
                                        {!survey.open && ' · cerrada'}
                                    </span>
                                </span>
                                {survey.answered ? (
                                    <span className="flex items-center gap-1 text-sm text-green-700 dark:text-green-400">
                                        <CheckCircle2 className="size-4" />{' '}
                                        Respondida
                                    </span>
                                ) : survey.open ? (
                                    <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-medium text-white">
                                        Responder
                                    </span>
                                ) : null}
                            </Link>
                        </li>
                    ))}
                    {surveys.length === 0 && (
                        <li className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                            No hay encuestas por ahora.
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
}

Surveys.layout = { breadcrumbs: [{ title: 'Encuestas', href: index() }] };
