import { Head, router } from '@inertiajs/react';
import { DailyLogCard } from '@/components/daily-log/daily-log-card';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localToday } from '@/lib/school';
import { mine } from '@/routes/daily-logs';
import type { DailyLogEntry, DailyLogOptions } from '@/types';

type Props = {
    date: string | null;
    children: { id: number; name: string; first_name: string }[];
    logs: (DailyLogEntry & {
        student_id: number;
        classroom: { name: string; color: string; mascot: string | null };
    })[];
    options: DailyLogOptions;
};

export default function MyDailyLogs({ date, children, logs, options }: Props) {
    const names = Object.fromEntries(children.map((c) => [c.id, c.first_name]));

    return (
        <>
            <Head title="Cuaderno diario" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <Heading
                        title="Cuaderno diario"
                        description="Cómo comió, durmió y se sintió tu hijo cada día, contado por su maestra."
                    />
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            className="w-auto"
                            aria-label="Ver un día"
                            value={date ?? ''}
                            max={localToday()}
                            onChange={(e) =>
                                router.get(
                                    mine.url(),
                                    e.target.value
                                        ? { fecha: e.target.value }
                                        : {},
                                )
                            }
                        />
                        {date && (
                            <Button
                                variant="ghost"
                                onClick={() => router.get(mine.url())}
                            >
                                Últimos 14 días
                            </Button>
                        )}
                    </div>
                </div>
                {logs.length === 0 ? (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        {date
                            ? 'No hay cuaderno para ese día.'
                            : 'Aún no hay cuadernos enviados en los últimos 14 días.'}
                    </p>
                ) : (
                    logs.map((log) => (
                        <DailyLogCard
                            key={log.id}
                            log={log}
                            options={options}
                            color={log.classroom.color}
                            title={
                                children.length > 1
                                    ? `${names[log.student_id]} · ${log.classroom.mascot ?? ''} ${log.classroom.name}`
                                    : `${log.classroom.mascot ?? ''} Salón ${log.classroom.name}`
                            }
                        />
                    ))
                )}
            </div>
        </>
    );
}

MyDailyLogs.layout = {
    breadcrumbs: [{ title: 'Cuaderno diario', href: mine() }],
};
