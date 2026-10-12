import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    download,
    index,
    submissions as submissionsRoute,
} from '@/routes/admin/events';
import type { EventTheme, FormField } from '@/types';

type Props = {
    event: {
        id: number;
        title: string;
        theme: EventTheme;
        form_schema: Required<FormField>[];
    };
    submissions: {
        id: number;
        parent: string;
        student: string | null;
        data: Record<string, unknown>;
        created_at: string;
    }[];
};

const text = (value: unknown) =>
    value === true
        ? 'Sí'
        : value === false
          ? 'No'
          : value == null
            ? ''
            : String(value);

export default function EventSubmissions({ event, submissions }: Props) {
    return (
        <>
            <Head title={`Respuestas · ${event.title}`} />
            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title={`${event.theme.emoji ?? ''} Respuestas: ${event.title}`}
                        description={`${submissions.length} respuestas recibidas.`}
                    />
                    <Button variant="outline" asChild>
                        <a href={download.url(event.id)}>
                            <Download /> Descargar Excel
                        </a>
                    </Button>
                </div>
                <div className="overflow-x-auto rounded-2xl border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3 font-medium">Familia</th>
                                <th className="p-3 font-medium">Alumno</th>
                                {event.form_schema.map((field) => (
                                    <th
                                        key={field.key}
                                        className="p-3 font-medium"
                                    >
                                        {field.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {submissions.map((submission) => (
                                <tr key={submission.id}>
                                    <td className="p-3">{submission.parent}</td>
                                    <td className="p-3">
                                        {submission.student}
                                    </td>
                                    {event.form_schema.map((field) => (
                                        <td key={field.key} className="p-3">
                                            {text(submission.data[field.key])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {submissions.length === 0 && (
                        <p className="p-8 text-center text-muted-foreground">
                            Aún no hay respuestas.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

EventSubmissions.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Eventos y sorteos', href: index() },
        { title: props.event.title, href: submissionsRoute(props.event.id) },
    ],
});
