import { Head, Link, router, useForm } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import ReportCardController from '@/actions/App/Http/Controllers/ReportCardController';
import { gradeTones } from '@/components/school/grades';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { show as showClassroom } from '@/routes/classrooms';
import {
    classroom as classroomRoute,
    show as showCard,
} from '@/routes/report-cards';
import type { CompetencyCatalog, GradeEntry, GradingPeriodItem } from '@/types';

type StudentRow = {
    id: number;
    name: string;
    grades: Record<string, GradeEntry>;
    comment: string | null;
    graded: number;
};

type Props = {
    classroom: {
        id: number;
        name: string;
        color: string;
        mascot: string | null;
    };
    periods: GradingPeriodItem[];
    period: GradingPeriodItem | null;
    students: StudentRow[];
    catalog: CompetencyCatalog;
    total: number;
};

const textareaClass =
    'min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

function Editor({
    classroomId,
    period,
    student,
    catalog,
    onClose,
}: {
    classroomId: number;
    period: GradingPeriodItem;
    student: StudentRow;
    catalog: CompetencyCatalog;
    onClose: () => void;
}) {
    const form = useForm({
        grades: Object.fromEntries(
            catalog.areas.flatMap((area) =>
                area.competencies.map((c) => [
                    c.key,
                    {
                        grade: student.grades[c.key]?.grade ?? '',
                        conclusion: student.grades[c.key]?.conclusion ?? '',
                    },
                ]),
            ),
        ) as Record<string, { grade: string; conclusion: string }>,
        comment: student.comment ?? '',
    });
    const { data, setData } = form;

    function setEntry(
        key: string,
        patch: Partial<{ grade: string; conclusion: string }>,
    ) {
        setData('grades', {
            ...data.grades,
            [key]: { ...data.grades[key], ...patch },
        });
    }

    return (
        <form
            className="space-y-5"
            onSubmit={(event) => {
                event.preventDefault();
                form.submit(
                    ReportCardController.save([
                        classroomId,
                        period.id,
                        student.id,
                    ]),
                    { preserveScroll: true, onSuccess: onClose },
                );
            }}
        >
            {catalog.areas.map((area) => (
                <section key={area.key} className="space-y-3">
                    <h3 className="font-semibold">{area.area}</h3>
                    {area.competencies.map((competency) => {
                        const entry = data.grades[competency.key];

                        return (
                            <div
                                key={competency.key}
                                className="space-y-2 rounded-xl border p-3"
                            >
                                <p className="text-sm">{competency.label}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {catalog.grades.map((grade) => (
                                        <button
                                            key={grade.value}
                                            type="button"
                                            title={grade.label}
                                            aria-pressed={
                                                entry.grade === grade.value
                                            }
                                            onClick={() =>
                                                setEntry(competency.key, {
                                                    grade:
                                                        entry.grade ===
                                                        grade.value
                                                            ? ''
                                                            : grade.value,
                                                })
                                            }
                                            className={cn(
                                                'min-w-11 rounded-lg border px-2.5 py-1 text-sm font-bold transition',
                                                entry.grade === grade.value
                                                    ? gradeTones[grade.value]
                                                    : 'hover:bg-accent',
                                            )}
                                        >
                                            {grade.value}
                                        </button>
                                    ))}
                                </div>
                                {(entry.grade === 'B' ||
                                    entry.grade === 'C' ||
                                    entry.conclusion) && (
                                    <textarea
                                        className={textareaClass}
                                        aria-label="Conclusión descriptiva"
                                        placeholder="Conclusión descriptiva: qué logra y en qué necesita apoyo"
                                        value={entry.conclusion}
                                        onChange={(e) =>
                                            setEntry(competency.key, {
                                                conclusion: e.target.value,
                                            })
                                        }
                                    />
                                )}
                            </div>
                        );
                    })}
                </section>
            ))}
            <div className="grid gap-2">
                <Label htmlFor="card-comment">Comentario de la tutora</Label>
                <textarea
                    id="card-comment"
                    className={textareaClass}
                    value={data.comment}
                    onChange={(e) => setData('comment', e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={form.processing}>
                    Guardar libreta
                </Button>
            </div>
        </form>
    );
}

export default function ReportCardsClassroom({
    classroom,
    periods,
    period,
    students,
    catalog,
    total,
}: Props) {
    const [editing, setEditing] = useState<StudentRow | null>(null);

    return (
        <>
            <Head title={`Libretas · ${classroom.name}`} />
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <header
                    className="space-y-3 rounded-3xl p-5"
                    style={{ backgroundColor: `${classroom.color}22` }}
                >
                    <h1 className="text-2xl font-bold">
                        {classroom.mascot} Libretas de notas · {classroom.name}
                    </h1>
                    {periods.length > 0 && period ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <NativeSelect
                                className="w-56 bg-background"
                                aria-label="Periodo"
                                value={period.id}
                                options={periods.map((p) => ({
                                    value: p.id,
                                    label: p.name,
                                }))}
                                onChange={(e) =>
                                    router.get(
                                        classroomRoute.url(classroom.id),
                                        {
                                            periodo: e.target.value,
                                        },
                                    )
                                }
                            />
                            <span className="text-sm">
                                {period.published
                                    ? 'Publicado: las familias ya ven las libretas.'
                                    : 'Aún no publicado para las familias.'}
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm">
                            La administradora debe crear los periodos (bimestres
                            o trimestres) en Configuración.
                        </p>
                    )}
                </header>

                {period && (
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {students.map((student) => (
                            <li
                                key={student.id}
                                className="flex items-center gap-3 rounded-2xl border bg-card p-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold">
                                        {student.name}
                                    </p>
                                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-green-600"
                                            style={{
                                                width: `${(student.graded / total) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {student.graded} de {total} competencias
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Button
                                        size="sm"
                                        onClick={() => setEditing(student)}
                                    >
                                        Calificar
                                    </Button>
                                    {student.graded > 0 && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            asChild
                                        >
                                            <Link
                                                href={showCard([
                                                    student.id,
                                                    period.id,
                                                ])}
                                            >
                                                <FileText /> Ver
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog
                open={editing !== null}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing?.name} · {period?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {editing && period && (
                        <Editor
                            key={editing.id}
                            classroomId={classroom.id}
                            period={period}
                            student={editing}
                            catalog={catalog}
                            onClose={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

ReportCardsClassroom.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: `Salón ${props.classroom.name}`,
            href: showClassroom(props.classroom.id),
        },
        { title: 'Libretas', href: classroomRoute(props.classroom.id) },
    ],
});
