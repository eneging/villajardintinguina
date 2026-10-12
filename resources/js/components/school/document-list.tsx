import { AlertTriangle, FileText, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { day } from '@/components/billing/format';
import { open } from '@/routes/documents';

export type DocumentRow = {
    id: number;
    owner_type: 'institution' | 'student' | 'employee';
    owner: string | null;
    category: string;
    title: string;
    expires_on: string | null;
    expired: boolean;
    expires_soon: boolean;
    visibility: string;
};

const visibilityLabels: Record<string, string> = {
    all: 'Todos',
    families: 'Familias',
    staff: 'Personal',
    private: 'Solo administración',
    shared: 'Compartido',
};

export function DocumentList({
    documents,
    onDelete,
}: {
    documents: DocumentRow[];
    onDelete?: (doc: DocumentRow) => void;
}) {
    if (documents.length === 0) {
        return (
            <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                No hay documentos.
            </p>
        );
    }

    return (
        <ul className="divide-y rounded-2xl border bg-card">
            {documents.map((document) => (
                <li
                    key={document.id}
                    className="flex flex-wrap items-center gap-3 p-4"
                >
                    <FileText className="size-5 shrink-0 text-muted-foreground" />
                    <a
                        href={open.url(document.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1"
                    >
                        <span className="block font-medium underline-offset-4 hover:underline">
                            {document.title}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {document.category}
                            {document.owner && ` · ${document.owner}`}
                            {onDelete &&
                                ` · ${visibilityLabels[document.visibility] ?? document.visibility}`}
                        </span>
                    </a>
                    {document.expires_on && <ExpiryBadge document={document} />}
                    {onDelete && (
                        <button
                            type="button"
                            aria-label="Eliminar documento"
                            className="rounded-md p-2 hover:bg-accent"
                            onClick={() => onDelete(document)}
                        >
                            <Trash2 className="size-4" />
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}

function ExpiryBadge({ document }: { document: DocumentRow }): ReactNode {
    if (document.expired) {
        return (
            <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                <AlertTriangle className="size-3" /> Venció{' '}
                {day(document.expires_on!)}
            </span>
        );
    }

    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${document.expires_soon ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'}`}
        >
            {document.expires_soon && (
                <AlertTriangle className="mr-1 inline size-3" />
            )}
            Vence {day(document.expires_on!)}
        </span>
    );
}
