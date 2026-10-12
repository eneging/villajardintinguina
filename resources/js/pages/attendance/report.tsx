import { Head, router } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { classroom as classroomRoute, report } from '@/routes/attendance';
import { show } from '@/routes/classrooms';

type Props = {
    classroom: { id: number; name: string; mascot: string | null };
    month: string;
    days: string[];
    rows: {
        name: string;
        days: Record<string, string>;
        totals: Record<string, number>;
    }[];
};

const symbols: Record<string, { text: string; className: string }> = {
    presente: { text: '●', className: 'text-green-600' },
    tardanza: { text: 'T', className: 'text-amber-600 font-bold' },
    falta: { text: 'F', className: 'text-red-600 font-bold' },
    justificada: { text: 'J', className: 'text-sky-600 font-bold' },
};

export default function AttendanceReport({
    classroom,
    month,
    days,
    rows,
}: Props) {
    return (
        <>
            <Head title={`Reporte de asistencia · ${classroom.name}`} />
            <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title={`${classroom.mascot ?? ''} Asistencia de ${classroom.name}`}
                        description="● presente · T tardanza · F falta · J justificada"
                    />
                    <div className="flex gap-2 print:hidden">
                        <Input
                            type="month"
                            className="w-44"
                            value={month}
                            onChange={(e) =>
                                router.get(report.url(classroom.id), {
                                    mes: e.target.value,
                                })
                            }
                        />
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            <Printer /> Imprimir
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto rounded-2xl border bg-card">
                    <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="sticky left-0 bg-muted p-2 text-left font-medium">
                                    Alumno
                                </th>
                                {days.map((day) => (
                                    <th
                                        key={day}
                                        className="p-1 text-center font-medium"
                                    >
                                        {Number(day.slice(8))}
                                    </th>
                                ))}
                                <th className="p-2 text-center">P</th>
                                <th className="p-2 text-center">T</th>
                                <th className="p-2 text-center">F</th>
                                <th className="p-2 text-center">J</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.map((row) => (
                                <tr key={row.name}>
                                    <td className="sticky left-0 bg-card p-2 whitespace-nowrap">
                                        {row.name}
                                    </td>
                                    {days.map((day) => {
                                        const symbol = symbols[row.days[day]];

                                        return (
                                            <td
                                                key={day}
                                                className={`p-1 text-center ${symbol?.className ?? 'text-muted-foreground/40'}`}
                                            >
                                                {symbol?.text ?? '·'}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 text-center font-medium">
                                        {row.totals.presente}
                                    </td>
                                    <td className="p-2 text-center">
                                        {row.totals.tardanza}
                                    </td>
                                    <td className="p-2 text-center">
                                        {row.totals.falta}
                                    </td>
                                    <td className="p-2 text-center">
                                        {row.totals.justificada}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

AttendanceReport.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: `Salón ${props.classroom.name}`,
            href: show(props.classroom.id),
        },
        { title: 'Asistencia', href: classroomRoute(props.classroom.id) },
        { title: 'Reporte', href: report(props.classroom.id) },
    ],
});
