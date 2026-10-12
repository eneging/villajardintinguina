import { Head, Link, usePage } from '@inertiajs/react';
import { BookHeart, Wallet } from 'lucide-react';
import { money } from '@/components/billing/format';
import Heading from '@/components/heading';
import { ModuleCard } from '@/components/school/module-card';
import { ClassroomTile } from '@/pages/classrooms/index';
import { show } from '@/routes/classrooms';
import { dashboard } from '@/routes';
import { index as billing } from '@/routes/admin/billing';
import { mine as myInduction } from '@/routes/induction';
import { index as myPayments } from '@/routes/payments';
import type { ClassroomSummary, LearningModuleCard } from '@/types';

type Child = {
    id: number;
    name: string;
    classroom: Omit<ClassroomSummary, 'staff'> | null;
};

type Props = {
    children: Child[];
    latestModules: LearningModuleCard[];
    managedClassrooms: ClassroomSummary[];
    induction: { required: number; completed: number } | null;
    debt: number | null;
    finance: { overdue: number; pending_vouchers: number } | null;
};

export default function Dashboard({
    children,
    latestModules,
    managedClassrooms,
    induction,
    debt,
    finance,
}: Props) {
    const { auth } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];

    return (
        <>
            <Head title="Inicio" />
            <div className="space-y-10 p-4">
                <Heading
                    title={`¡Hola, ${firstName}! 👋`}
                    description="Bienvenida/o a la plataforma de EP Villa Jardín."
                />

                {debt !== null && debt > 0 && (
                    <Link
                        href={myPayments()}
                        className="flex items-center gap-4 rounded-2xl border-2 border-red-200 bg-red-50 p-5 transition hover:shadow-md dark:border-red-900 dark:bg-red-950/40"
                    >
                        <Wallet className="size-10 shrink-0 text-red-600" />
                        <span>
                            <span className="block font-semibold">
                                Tienes {money(debt)} por pagar
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Revisa tus cuotas y envía tu voucher desde Mis
                                pagos.
                            </span>
                        </span>
                    </Link>
                )}

                {finance && (
                    <Link
                        href={billing()}
                        className="grid gap-4 rounded-2xl border bg-card p-5 transition hover:shadow-md sm:grid-cols-2"
                    >
                        <span>
                            <span className="block text-sm text-muted-foreground">
                                Pensiones vencidas por cobrar
                            </span>
                            <span className="text-2xl font-bold text-red-700 tabular-nums">
                                {money(finance.overdue)}
                            </span>
                        </span>
                        <span>
                            <span className="block text-sm text-muted-foreground">
                                Vouchers por verificar
                            </span>
                            <span className="text-2xl font-bold text-amber-700 tabular-nums">
                                {finance.pending_vouchers}
                            </span>
                        </span>
                    </Link>
                )}

                {induction && induction.required > induction.completed && (
                    <Link
                        href={myInduction()}
                        className="flex items-center gap-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 transition hover:shadow-md dark:border-amber-700 dark:bg-amber-950/40"
                    >
                        <BookHeart className="size-10 shrink-0 text-amber-600" />
                        <span>
                            <span className="block font-semibold">
                                Completa tu inducción
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Llevas {induction.completed} de{' '}
                                {induction.required} lecciones obligatorias.
                                Conoce cómo trabajamos con tus hijos.
                            </span>
                        </span>
                    </Link>
                )}

                {children.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Mis hijos</h2>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {children.map((child) =>
                                child.classroom ? (
                                    <Link
                                        key={child.id}
                                        href={show(child.classroom.id)}
                                        className="flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition hover:shadow-md"
                                        style={{
                                            backgroundColor: `${child.classroom.color}1f`,
                                        }}
                                    >
                                        <span className="text-4xl" aria-hidden>
                                            {child.classroom.mascot ?? '🏫'}
                                        </span>
                                        <span>
                                            <span className="block font-semibold">
                                                {child.name}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                Salón {child.classroom.name} ·{' '}
                                                {child.classroom.level}
                                            </span>
                                        </span>
                                    </Link>
                                ) : (
                                    <div
                                        key={child.id}
                                        className="rounded-2xl border p-4 text-muted-foreground"
                                    >
                                        {child.name} — sin matrícula este año
                                    </div>
                                ),
                            )}
                        </div>
                    </section>
                )}

                {latestModules.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">
                            Lo que están aprendiendo
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {latestModules.map((module) => (
                                <ModuleCard key={module.id} module={module} />
                            ))}
                        </div>
                    </section>
                )}

                {managedClassrooms.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">
                            {auth.roles.includes('admin')
                                ? 'Salones del colegio'
                                : 'Mis salones'}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {managedClassrooms.map((classroom) => (
                                <ClassroomTile
                                    key={classroom.id}
                                    classroom={classroom}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {children.length === 0 && managedClassrooms.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        Tu cuenta aún no está vinculada a un salón. La
                        administradora la activará pronto.
                    </p>
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Inicio', href: dashboard() }],
};
