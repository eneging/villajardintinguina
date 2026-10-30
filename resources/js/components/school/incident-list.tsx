import { router } from '@inertiajs/react';
import { CheckCircle2, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { acknowledge } from '@/routes/incidents';
import type { IncidentItem } from '@/types';

const when = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

export function IncidentList({
    incidents,
    showStudent = false,
    canAcknowledge = false,
}: {
    incidents: IncidentItem[];
    showStudent?: boolean;
    canAcknowledge?: boolean;
}) {
    if (incidents.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Sin incidentes registrados.
            </p>
        );
    }

    return (
        <ul className="space-y-3">
            {incidents.map((incident) => (
                <li
                    key={incident.id}
                    className="space-y-1.5 rounded-xl border p-3 text-sm"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">
                            {incident.type_label}
                            {showStudent &&
                                incident.student &&
                                ` · ${incident.student.name}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {when.format(new Date(incident.occurred_at))}
                            {incident.classroom && ` · ${incident.classroom}`}
                        </span>
                    </div>
                    <p>{incident.description}</p>
                    {incident.action_taken && (
                        <p className="text-muted-foreground">
                            <strong>Qué se hizo:</strong>{' '}
                            {incident.action_taken}
                        </p>
                    )}
                    {incident.medicine && (
                        <p className="flex items-center gap-1 text-muted-foreground">
                            <Pill className="size-4" /> {incident.medicine}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Registró: {incident.reported_by ?? '—'}</span>
                        {incident.acknowledged_at ? (
                            <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                                <CheckCircle2 className="size-3.5" /> Familia
                                enterada
                                {incident.acknowledged_by &&
                                    ` (${incident.acknowledged_by})`}
                            </span>
                        ) : canAcknowledge ? (
                            <Button
                                size="sm"
                                onClick={() =>
                                    router.post(
                                        acknowledge.url(incident.id),
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Estoy enterado(a)
                            </Button>
                        ) : (
                            <span className="text-amber-700 dark:text-amber-400">
                                Familia aún no confirma
                            </span>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}
