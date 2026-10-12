import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { DocumentList } from '@/components/school/document-list';
import type { DocumentRow } from '@/components/school/document-list';
import { index } from '@/routes/documents';

const groups = [
    { key: 'institution', title: 'Del colegio' },
    { key: 'student', title: 'De mis hijos' },
    { key: 'employee', title: 'Míos' },
] as const;

export default function Documents({ documents }: { documents: DocumentRow[] }) {
    return (
        <>
            <Head title="Documentos" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <Heading
                    title="Documentos"
                    description="Reglamentos, protocolos y documentos compartidos contigo."
                />
                {groups.map(({ key, title }) => {
                    const items = documents.filter((d) => d.owner_type === key);

                    return items.length > 0 ? (
                        <section key={key} className="space-y-2">
                            <h2 className="font-semibold">{title}</h2>
                            <DocumentList documents={items} />
                        </section>
                    ) : null;
                })}
                {documents.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Aún no hay documentos compartidos contigo.
                    </p>
                )}
            </div>
        </>
    );
}

Documents.layout = { breadcrumbs: [{ title: 'Documentos', href: index() }] };
