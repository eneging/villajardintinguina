import type { ReactNode } from 'react';
import type { Complaint, Provider } from '@/types';

const dateTime = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
});
const date = new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' });

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1 sm:grid-cols-[14rem_1fr]">
            <dt className="text-sm font-medium text-slate-500">{label}</dt>
            <dd className="whitespace-pre-line">{children}</dd>
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-3 border-t pt-4">
            <h2 className="text-sm font-bold tracking-wide text-slate-700 uppercase">
                {title}
            </h2>
            <dl className="space-y-2">{children}</dl>
        </section>
    );
}

/** Hoja de reclamación tal como queda registrada (constancia imprimible). */
export function ComplaintSheet({
    complaint,
    provider,
}: {
    complaint: Complaint;
    provider: Provider;
}) {
    return (
        <article className="space-y-5 rounded-2xl border bg-white p-6 text-slate-800 shadow-sm print:border-0 print:shadow-none">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Libro de Reclamaciones Virtual
                    </p>
                    <h1 className="text-2xl font-bold">
                        Hoja de reclamación N° {complaint.code}
                    </h1>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                    {complaint.type_label}
                </span>
            </header>

            <Section title="1. Proveedor">
                <Row label="Razón social">{provider.legal_name}</Row>
                <Row label="RUC">{provider.ruc}</Row>
                <Row label="Dirección">{provider.address}</Row>
                <Row label="Fecha de registro">
                    {dateTime.format(new Date(complaint.created_at))}
                </Row>
            </Section>

            <Section title="2. Consumidor reclamante">
                <Row label="Nombre">{complaint.consumer_name}</Row>
                <Row label="Documento">
                    {complaint.consumer_document_type}{' '}
                    {complaint.consumer_document_number}
                </Row>
                <Row label="Domicilio">{complaint.consumer_address}</Row>
                <Row label="Teléfono">{complaint.consumer_phone}</Row>
                <Row label="Correo">{complaint.consumer_email}</Row>
                {complaint.is_minor && (
                    <Row label="Padre, madre o apoderado">
                        {complaint.guardian_name} (
                        {complaint.guardian_document_number})
                    </Row>
                )}
            </Section>

            <Section title="3. Bien contratado">
                <Row label="Tipo">
                    {complaint.item_type === 'producto'
                        ? 'Producto'
                        : 'Servicio'}
                </Row>
                <Row label="Descripción">{complaint.item_description}</Row>
                {complaint.amount && (
                    <Row label="Monto reclamado">
                        S/ {Number(complaint.amount).toFixed(2)}
                    </Row>
                )}
            </Section>

            <Section title="4. Detalle de la reclamación y pedido">
                <Row label="Detalle">{complaint.detail}</Row>
                <Row label="Pedido">{complaint.request}</Row>
            </Section>

            <Section title="5. Observaciones y acciones del proveedor">
                {complaint.responded_at ? (
                    <>
                        <Row label="Respuesta">{complaint.response}</Row>
                        <Row label="Fecha de respuesta">
                            {date.format(new Date(complaint.responded_at))}
                        </Row>
                    </>
                ) : (
                    <Row label="Plazo de respuesta">
                        Hasta el{' '}
                        {date.format(
                            new Date(`${complaint.response_due_on}T00:00:00`),
                        )}
                    </Row>
                )}
            </Section>

            <footer className="space-y-1 border-t pt-4 text-xs text-slate-500">
                <p>
                    <strong>Reclamo:</strong> disconformidad relacionada a los
                    productos o servicios. <strong>Queja:</strong>{' '}
                    disconformidad no relacionada a los productos o servicios; o
                    malestar o descontento respecto a la atención al público.
                </p>
                <p>
                    La formulación del reclamo no impide acudir a otras vías de
                    solución de controversias ni es requisito previo para
                    interponer una denuncia ante el INDECOPI.
                </p>
                <p>
                    El proveedor deberá dar respuesta al reclamo o queja en un
                    plazo no mayor a quince (15) días hábiles.
                </p>
            </footer>
        </article>
    );
}
