import { Head, Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { money } from '@/components/billing/format';
import Heading from '@/components/heading';
import { StudentAvatar } from '@/components/school/student-avatar';
import { cn } from '@/lib/utils';
import { index } from '@/routes/children';
import { show } from '@/routes/students';
import type { AttendanceStatus, StudentSummary } from '@/types';

type Child = StudentSummary & {
    today: AttendanceStatus | null;
    balance: number;
    overdue: boolean;
};

const todayLabels: Record<AttendanceStatus, string> = {
    presente: '✅ Llegó hoy',
    tardanza: '🕘 Llegó tarde hoy',
    falta: '❌ No asistió hoy',
    justificada: '📝 Falta justificada hoy',
};

export default function Children({ children }: { children: Child[] }) {
    return (
        <>
            <Head title="Mis hijos" />
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title="Mis hijos"
                    description="Ficha, salón, personas autorizadas para recogerlos y estado de cuenta."
                />
                {children.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Aún no hay alumnos vinculados a tu cuenta. Comunícate
                        con la dirección.
                    </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                    {children.map((child) => (
                        <Link
                            key={child.id}
                            href={show(child.id)}
                            className="group flex items-center gap-4 rounded-3xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                            style={{
                                borderColor: child.classroom?.color,
                            }}
                        >
                            <StudentAvatar
                                student={child}
                                className="size-20 shrink-0"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-lg font-semibold group-hover:underline">
                                    {child.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {child.classroom
                                        ? `${child.classroom.mascot ?? ''} Salón ${child.classroom.name}`
                                        : 'Sin matrícula activa'}
                                    {child.age && ` · ${child.age}`}
                                </p>
                                <div className="flex flex-wrap gap-1 text-xs">
                                    {child.today && (
                                        <span className="rounded-full bg-muted px-2 py-0.5">
                                            {todayLabels[child.today]}
                                        </span>
                                    )}
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5',
                                            child.overdue
                                                ? 'bg-red-100 text-red-800'
                                                : child.balance > 0
                                                  ? 'bg-amber-100 text-amber-800'
                                                  : 'bg-green-100 text-green-800',
                                        )}
                                    >
                                        {child.balance > 0
                                            ? `Por pagar ${money(child.balance)}`
                                            : 'Pagos al día'}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="size-5 text-muted-foreground" />
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

Children.layout = {
    breadcrumbs: [{ title: 'Mis hijos', href: index() }],
};
