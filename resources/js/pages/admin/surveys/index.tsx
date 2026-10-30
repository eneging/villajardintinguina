import { Head, Link } from '@inertiajs/react';
import { BarChart3, Pencil, Plus } from 'lucide-react';
import { day } from '@/components/billing/format';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { create, edit, index, results } from '@/routes/admin/surveys';

type Row = {
    id: number;
    title: string;
    audience: string;
    published: boolean;
    open: boolean;
    closes_on: string | null;
    responses: number;
};

export default function SurveysAdmin({ surveys }: { surveys: Row[] }) {
    return (
        <>
            <Head title="Encuestas" />
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Encuestas de satisfacción"
                        description="Pregunta a las familias o al personal y mira los resultados en gráficos."
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> Nueva encuesta
                        </Link>
                    </Button>
                </div>
                <ul className="divide-y rounded-2xl border bg-card">
                    {surveys.map((survey) => (
                        <li
                            key={survey.id}
                            className="flex flex-wrap items-center gap-3 p-4"
                        >
                            <span className="min-w-0 flex-1">
                                <span className="block font-medium">
                                    {survey.title}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {survey.audience} · {survey.responses}{' '}
                                    respuesta(s)
                                    {survey.closes_on &&
                                        ` · cierra el ${day(survey.closes_on)}`}
                                </span>
                            </span>
                            {!survey.published ? (
                                <Badge variant="secondary">Borrador</Badge>
                            ) : survey.open ? (
                                <Badge>Abierta</Badge>
                            ) : (
                                <Badge variant="outline">Cerrada</Badge>
                            )}
                            <Button size="sm" variant="outline" asChild>
                                <Link href={results(survey.id)}>
                                    <BarChart3 /> Resultados
                                </Link>
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                                <Link
                                    href={edit(survey.id)}
                                    aria-label="Editar"
                                >
                                    <Pencil />
                                </Link>
                            </Button>
                        </li>
                    ))}
                    {surveys.length === 0 && (
                        <li className="p-8 text-center text-muted-foreground">
                            Aún no hay encuestas.
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
}

SurveysAdmin.layout = { breadcrumbs: [{ title: 'Encuestas', href: index() }] };
