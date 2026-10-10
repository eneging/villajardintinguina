import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/admin/complaints';

type Row = {
    id: number;
    code: string;
    type_label: string;
    consumer_name: string;
    item_description: string;
    created_at: string;
    response_due_on: string;
    business_days_left: number | null;
    answered: boolean;
};

const date = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' });

export function DeadlineBadge({
    answered,
    daysLeft,
}: {
    answered: boolean;
    daysLeft: number | null;
}) {
    if (answered || daysLeft === null) {
        return (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                Respondida
            </span>
        );
    }

    const tone =
        daysLeft < 0
            ? 'bg-red-600 text-white'
            : daysLeft <= 3
              ? 'bg-red-100 text-red-800'
              : daysLeft <= 7
                ? 'bg-amber-100 text-amber-800'
                : 'bg-green-100 text-green-800';
    const label =
        daysLeft < 0
            ? `Vencida hace ${-daysLeft} día${daysLeft === -1 ? '' : 's'} hábil${daysLeft === -1 ? '' : 'es'}`
            : daysLeft === 0
              ? 'Vence hoy'
              : `${daysLeft} día${daysLeft === 1 ? '' : 's'} hábil${daysLeft === 1 ? '' : 'es'}`;

    return (
        <span
            className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                tone,
            )}
        >
            {label}
        </span>
    );
}

export default function ComplaintsIndex({ complaints }: { complaints: Row[] }) {
    const pending = complaints.filter((c) => !c.answered).length;

    return (
        <>
            <Head title="Libro de Reclamaciones" />
            <div className="space-y-6 p-4">
                <Heading
                    title="Libro de Reclamaciones"
                    description={`${pending} pendiente${pending === 1 ? '' : 's'} de respuesta · plazo legal de 15 días hábiles.`}
                />

                {complaints.length === 0 ? (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        No hay hojas de reclamación registradas.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border bg-card">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3 font-medium">N°</th>
                                    <th className="p-3 font-medium">Tipo</th>
                                    <th className="p-3 font-medium">
                                        Consumidor
                                    </th>
                                    <th className="p-3 font-medium">
                                        Registrada
                                    </th>
                                    <th className="p-3 font-medium">Plazo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {complaints.map((complaint) => (
                                    <tr
                                        key={complaint.id}
                                        className="hover:bg-accent"
                                    >
                                        <td className="p-3 font-mono">
                                            <Link
                                                href={show(complaint.id)}
                                                className="underline-offset-4 hover:underline"
                                            >
                                                {complaint.code}
                                            </Link>
                                        </td>
                                        <td className="p-3">
                                            {complaint.type_label}
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium">
                                                {complaint.consumer_name}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {complaint.item_description}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            {date.format(
                                                new Date(complaint.created_at),
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <DeadlineBadge
                                                answered={complaint.answered}
                                                daysLeft={
                                                    complaint.business_days_left
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

ComplaintsIndex.layout = {
    breadcrumbs: [{ title: 'Libro de Reclamaciones', href: index() }],
};
