import { Head } from '@inertiajs/react';
import { day } from '@/components/billing/format';
import { PublicLayout } from '@/components/school/public-layout';
import { RichText } from '@/components/school/rich-text';

export default function Privacy({
    updated_on,
    body,
}: {
    updated_on: string;
    body: string;
}) {
    return (
        <PublicLayout>
            <Head title="Política de privacidad" />
            <article className="space-y-6 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
                <header className="space-y-1">
                    <h1 className="font-display text-4xl font-extrabold text-slate-900">
                        Política de privacidad
                    </h1>
                    <p className="text-sm text-slate-500">
                        Protección de datos personales · Ley N° 29733 ·
                        Actualizada el {day(updated_on)}
                    </p>
                </header>
                <RichText text={body} />
            </article>
        </PublicLayout>
    );
}
