import { Head, Link } from '@inertiajs/react';
import { FilePlus2, Pencil, RefreshCw } from 'lucide-react';
import { day } from '@/components/billing/format';
import Heading from '@/components/heading';
import { EnrollmentStatus } from '@/components/school/enrollment-status';
import { Button } from '@/components/ui/button';
import { create, edit, index } from '@/routes/enrollment';
import type { EnrollmentRequestItem } from '@/types';

type Props = {
    requests: EnrollmentRequestItem[];
    children: { id: number; name: string }[];
};

export default function EnrollmentIndex({ requests, children }: Props) {
    return (
        <>
            <Head title="Matrícula en línea" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <Heading
                    title="Matrícula en línea"
                    description="Completa la ficha de tu hijo, sube sus documentos y la dirección la revisará."
                />
                <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href={create()}>
                            <FilePlus2 /> Matricular a un nuevo hijo
                        </Link>
                    </Button>
                    {children.map((child) => (
                        <Button key={child.id} variant="outline" asChild>
                            <Link
                                href={create({ query: { alumno: child.id } })}
                            >
                                <RefreshCw /> Re-matricular a{' '}
                                {child.name.split(' ')[0]}
                            </Link>
                        </Button>
                    ))}
                </div>

                {requests.length === 0 ? (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Aún no has enviado solicitudes de matrícula.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {requests.map((request) => (
                            <li
                                key={request.id}
                                className="space-y-2 rounded-2xl border bg-card p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold">
                                            {request.child_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Año {request.year}
                                            {request.level &&
                                                ` · ${request.level}`}{' '}
                                            · enviada el{' '}
                                            {day(request.created_at)}
                                        </p>
                                    </div>
                                    <EnrollmentStatus
                                        status={request.status}
                                        label={request.status_label}
                                    />
                                </div>
                                {request.admin_notes &&
                                    request.status !== 'aprobada' && (
                                        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                                            <strong>Dirección:</strong>{' '}
                                            {request.admin_notes}
                                        </p>
                                    )}
                                {(request.status === 'enviada' ||
                                    request.status === 'observada') && (
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={edit(request.id)}>
                                            <Pencil />{' '}
                                            {request.status === 'observada'
                                                ? 'Corregir y reenviar'
                                                : 'Editar'}
                                        </Link>
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

EnrollmentIndex.layout = {
    breadcrumbs: [{ title: 'Matrícula en línea', href: index() }],
};
