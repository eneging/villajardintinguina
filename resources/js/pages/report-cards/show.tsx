import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { day } from '@/components/billing/format';
import { gradeTones } from '@/components/school/grades';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CompetencyCatalog, GradeEntry, GradingPeriodItem } from '@/types';

type Props = {
    school: { name: string; legal_name: string; address: string };
    period: GradingPeriodItem & { year: number };
    student: { name: string; dni: string | null };
    classroom: { name: string; level: string; teacher: string | null };
    grades: Record<string, GradeEntry>;
    comment: string | null;
    attendance: Record<string, number>;
    catalog: CompetencyCatalog;
};

export default function ReportCardShow({
    school,
    period,
    student,
    classroom,
    grades,
    comment,
    attendance,
    catalog,
}: Props) {
    return (
        <>
            <Head title={`Libreta · ${student.name}`} />
            <div className="mx-auto w-full max-w-3xl space-y-4 p-4 print:max-w-none print:p-0">
                <div className="flex justify-end print:hidden">
                    <Button onClick={() => window.print()}>
                        <Printer /> Imprimir o guardar PDF
                    </Button>
                </div>
                <article className="space-y-5 rounded-2xl border bg-white p-6 text-slate-900 print:rounded-none print:border-0 print:p-0">
                    <header className="flex items-start justify-between gap-4 border-b pb-4">
                        <div>
                            <p className="text-xs tracking-wide text-slate-500 uppercase">
                                Informe de progreso del aprendizaje
                            </p>
                            <h1 className="text-2xl font-bold">
                                {school.name}
                            </h1>
                            <p className="text-sm text-slate-600">
                                {school.address}
                            </p>
                        </div>
                        <div className="text-right text-sm">
                            <p className="font-semibold">
                                {period.name} · {period.year}
                            </p>
                            <p className="text-slate-600">
                                {day(period.starts_on)} – {day(period.ends_on)}
                            </p>
                        </div>
                    </header>

                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="inline text-slate-500">
                                Estudiante:{' '}
                            </dt>
                            <dd className="inline font-semibold">
                                {student.name}
                            </dd>
                        </div>
                        <div>
                            <dt className="inline text-slate-500">DNI: </dt>
                            <dd className="inline">{student.dni ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="inline text-slate-500">
                                Nivel y salón:{' '}
                            </dt>
                            <dd className="inline">
                                {classroom.level} · {classroom.name}
                            </dd>
                        </div>
                        <div>
                            <dt className="inline text-slate-500">Docente: </dt>
                            <dd className="inline">
                                {classroom.teacher ?? '—'}
                            </dd>
                        </div>
                    </dl>

                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-100 text-left">
                                <th className="border p-2">
                                    Área / competencia
                                </th>
                                <th className="w-16 border p-2 text-center">
                                    Logro
                                </th>
                                <th className="border p-2">
                                    Conclusión descriptiva
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {catalog.areas.map((area) => [
                                <tr key={area.key} className="bg-slate-50">
                                    <td
                                        colSpan={3}
                                        className="border p-2 font-semibold"
                                    >
                                        {area.area}
                                    </td>
                                </tr>,
                                ...area.competencies.map((competency) => {
                                    const entry = grades[competency.key];

                                    return (
                                        <tr key={competency.key}>
                                            <td className="border p-2">
                                                {competency.label}
                                            </td>
                                            <td className="border p-2 text-center">
                                                {entry?.grade ? (
                                                    <span
                                                        className={cn(
                                                            'inline-block min-w-9 rounded-md px-1.5 py-0.5 font-bold print:border print:bg-white print:text-black',
                                                            gradeTones[
                                                                entry.grade
                                                            ],
                                                        )}
                                                    >
                                                        {entry.grade}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="border p-2 text-slate-700">
                                                {entry?.conclusion}
                                            </td>
                                        </tr>
                                    );
                                }),
                            ])}
                        </tbody>
                    </table>

                    <p className="text-xs text-slate-500">
                        {catalog.grades
                            .map((g) => `${g.value}: ${g.label}`)
                            .join(' · ')}
                    </p>

                    <section className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border p-3 text-sm">
                            <p className="mb-1 font-semibold">
                                Asistencia del periodo
                            </p>
                            <p>
                                Asistencias: {attendance.presente ?? 0} ·
                                Tardanzas: {attendance.tardanza ?? 0} · Faltas:{' '}
                                {attendance.falta ?? 0} · Justificadas:{' '}
                                {attendance.justificada ?? 0}
                            </p>
                        </div>
                        <div className="rounded-xl border p-3 text-sm">
                            <p className="mb-1 font-semibold">
                                Comentario de la docente
                            </p>
                            <p className="whitespace-pre-line">
                                {comment ?? '—'}
                            </p>
                        </div>
                    </section>

                    <footer className="grid grid-cols-2 gap-8 pt-12 text-center text-sm">
                        <div className="border-t pt-2">Docente de aula</div>
                        <div className="border-t pt-2">Dirección</div>
                    </footer>
                </article>
            </div>
        </>
    );
}
