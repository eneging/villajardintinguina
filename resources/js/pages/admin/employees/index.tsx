import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { money } from '@/components/billing/format';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { create, edit, index } from '@/routes/admin/employees';
import { index as payroll } from '@/routes/admin/payroll';

type Row = {
    id: number;
    name: string;
    position: string;
    regime: string;
    base_salary: number;
    active: boolean;
    has_account: boolean;
};

export default function EmployeesIndex({ employees }: { employees: Row[] }) {
    return (
        <>
            <Head title="Trabajadores" />
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Trabajadores"
                        description="Sueldos y régimen. Vincula la cuenta de la plataforma para usar su asistencia en la planilla."
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> Nuevo trabajador
                        </Link>
                    </Button>
                </div>
                <div className="overflow-x-auto rounded-2xl border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3 font-medium">Nombre</th>
                                <th className="p-3 font-medium">Cargo</th>
                                <th className="p-3 font-medium">Régimen</th>
                                <th className="p-3 text-right font-medium">
                                    Sueldo
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {employees.map((employee) => (
                                <tr
                                    key={employee.id}
                                    className="hover:bg-accent"
                                >
                                    <td className="p-3">
                                        <Link
                                            href={edit(employee.id)}
                                            className="font-medium underline-offset-4 hover:underline"
                                        >
                                            {employee.name}
                                        </Link>
                                        {!employee.active && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-2"
                                            >
                                                Inactivo
                                            </Badge>
                                        )}
                                        {!employee.has_account && (
                                            <div className="text-xs text-muted-foreground">
                                                Sin cuenta: asistencia manual
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">{employee.position}</td>
                                    <td className="p-3">{employee.regime}</td>
                                    <td className="p-3 text-right tabular-nums">
                                        {money(employee.base_salary)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {employees.length === 0 && (
                        <p className="p-8 text-center text-muted-foreground">
                            Aún no hay trabajadores registrados.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

EmployeesIndex.layout = {
    breadcrumbs: [
        { title: 'Planilla', href: payroll() },
        { title: 'Trabajadores', href: index() },
    ],
};
