import { Head } from '@inertiajs/react';
import { CheckCircle2, Printer } from 'lucide-react';
import { ComplaintSheet } from '@/components/school/complaint-sheet';
import { PublicLayout } from '@/components/school/public-layout';
import { Button } from '@/components/ui/button';
import type { Complaint, Provider } from '@/types';

export default function ComplaintReceipt({
    complaint,
    provider,
}: {
    complaint: Complaint;
    provider: Provider;
}) {
    return (
        <PublicLayout>
            <Head title={`Constancia ${complaint.code}`} />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-green-50 p-5 text-green-900 print:hidden">
                    <p className="flex items-center gap-2 font-medium">
                        <CheckCircle2 className="size-6 text-green-600" />
                        Registramos tu hoja N° {complaint.code}. Te enviamos una
                        copia a {complaint.consumer_email}.
                    </p>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer /> Imprimir o guardar PDF
                    </Button>
                </div>
                <ComplaintSheet complaint={complaint} provider={provider} />
            </div>
        </PublicLayout>
    );
}
