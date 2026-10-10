import { Head, useForm } from '@inertiajs/react';
import { Printer, Send } from 'lucide-react';
import ComplaintController from '@/actions/App/Http/Controllers/Admin/ComplaintController';
import InputError from '@/components/input-error';
import { textareaClass } from '@/components/school/block-editor';
import { ComplaintSheet } from '@/components/school/complaint-sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DeadlineBadge } from '@/pages/complaints/index';
import { index, show } from '@/routes/admin/complaints';
import type { Complaint, Provider } from '@/types';

type Props = {
    complaint: Complaint & {
        responder: string | null;
        business_days_left: number | null;
        ip_address: string | null;
    };
    provider: Provider;
};

export default function ComplaintShow({ complaint, provider }: Props) {
    const form = useForm({ response: '' });

    return (
        <>
            <Head title={`Reclamo ${complaint.code}`} />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <DeadlineBadge
                        answered={complaint.responded_at !== null}
                        daysLeft={complaint.business_days_left}
                    />
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer /> Imprimir
                    </Button>
                </div>

                <ComplaintSheet complaint={complaint} provider={provider} />

                {complaint.responded_at ? (
                    complaint.responder && (
                        <p className="text-sm text-muted-foreground">
                            Respondida por {complaint.responder}.
                        </p>
                    )
                ) : (
                    <form
                        className="space-y-4 rounded-2xl border bg-card p-5 print:hidden"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (
                                confirm(
                                    'La respuesta se enviará por correo al consumidor y no podrá modificarse. ¿Continuar?',
                                )
                            ) {
                                form.submit(
                                    ComplaintController.respond(complaint.id),
                                    { preserveScroll: true },
                                );
                            }
                        }}
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="response">
                                Observaciones y acciones adoptadas por el
                                colegio
                            </Label>
                            <textarea
                                id="response"
                                className={textareaClass}
                                rows={6}
                                value={form.data.response}
                                onChange={(e) =>
                                    form.setData('response', e.target.value)
                                }
                            />
                            <InputError message={form.errors.response} />
                        </div>
                        <Button type="submit" disabled={form.processing}>
                            <Send /> Registrar y enviar respuesta
                        </Button>
                    </form>
                )}
            </div>
        </>
    );
}

ComplaintShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Libro de Reclamaciones', href: index() },
        { title: props.complaint.code, href: show(props.complaint.id) },
    ],
});
