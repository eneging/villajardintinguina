import { Head, Link, router } from '@inertiajs/react';
import { day } from '@/components/billing/format';
import Heading from '@/components/heading';
import { EnrollmentStatus } from '@/components/school/enrollment-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index, show } from '@/routes/admin/enrollments';
import type { Option } from '@/types';

type Row = {
    id: number;
    child_name: string;
    parent: string;
    year: number;
    level: string | null;
    status: string;
    status_label: string;
    renewal: boolean;
    created_at: string;
};

type Props = {
    requests: Row[];
    counts: Record<string, number>;
    statuses: Option[];
    status: string;
};

export default function EnrollmentsIndex({
    requests,
    counts,
    statuses,
    status,
}: Props) {
    return (
        <>
            <Head title="Matrículas en línea" />
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="Matrículas en línea"
                    description="Solicitudes enviadas por las familias. Al aprobar se crea la ficha, la matrícula y se archivan los documentos."
                />
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        variant={status === '' ? 'default' : 'outline'}
                        onClick={() => router.get(index.url())}
                    >
                        Todas
                    </Button>
                    {statuses.map((s) => (
                        <Button
                            key={s.value}
                            size="sm"
                            variant={status === s.value ? 'default' : 'outline'}
                            onClick={() =>
                                router.get(index.url(), { estado: s.value })
                            }
                        >
                            {s.label}
                            <Badge variant="secondary" className="ml-1">
                                {counts[s.value] ?? 0}
                            </Badge>
                        </Button>
                    ))}
                </div>
                <div className="overflow-x-auto rounded-2xl border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3 font-medium">Niño(a)</th>
                                <th className="p-3 font-medium">Apoderado</th>
                                <th className="p-3 font-medium">Año / nivel</th>
                                <th className="p-3 font-medium">Enviada</th>
                                <th className="p-3 font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {requests.map((row) => (
                                <tr key={row.id} className="hover:bg-accent">
                                    <td className="p-3">
                                        <Link
                                            href={show(row.id)}
                                            className="font-medium hover:underline"
                                        >
                                            {row.child_name}
                                        </Link>
                                        {row.renewal && (
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                (re-matrícula)
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3">{row.parent}</td>
                                    <td className="p-3">
                                        {row.year}
                                        {row.level && ` · ${row.level}`}
                                    </td>
                                    <td className="p-3">
                                        {day(row.created_at)}
                                    </td>
                                    <td className="p-3">
                                        <EnrollmentStatus
                                            status={row.status}
                                            label={row.status_label}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {requests.length === 0 && (
                        <p className="p-8 text-center text-muted-foreground">
                            No hay solicitudes.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

EnrollmentsIndex.layout = {
    breadcrumbs: [{ title: 'Matrículas en línea', href: index() }],
};
