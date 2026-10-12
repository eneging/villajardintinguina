import { Head, Link, useForm } from '@inertiajs/react';
import EmployeeController from '@/actions/App/Http/Controllers/Admin/EmployeeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/employees';
import type { Option } from '@/types';

type Props = {
    employee: {
        id: number;
        user_id: number | null;
        name: string;
        dni: string | null;
        position: string;
        regime: string;
        pension_system: string;
        base_salary: string;
        bank: string | null;
        account_number: string | null;
        hired_on: string | null;
        active: boolean;
    } | null;
    positions: Option[];
    regimes: Option[];
    accounts: { value: number; label: string }[];
};

export default function EmployeeForm({
    employee,
    positions,
    regimes,
    accounts,
}: Props) {
    const form = useForm({
        user_id: employee?.user_id ?? ('' as number | ''),
        name: employee?.name ?? '',
        dni: employee?.dni ?? '',
        position: employee?.position ?? 'maestra',
        regime: employee?.regime ?? 'planilla',
        pension_system: employee?.pension_system ?? 'onp',
        base_salary: employee?.base_salary ?? '',
        bank: employee?.bank ?? '',
        account_number: employee?.account_number ?? '',
        hired_on: employee?.hired_on ?? '',
        active: employee?.active ?? true,
    });
    const { data, setData, errors, processing } = form;

    return (
        <>
            <Head title={employee ? employee.name : 'Nuevo trabajador'} />
            <form
                className="mx-auto w-full max-w-2xl space-y-6 p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((values) => ({
                        ...values,
                        user_id: values.user_id === '' ? null : values.user_id,
                    }));
                    form.submit(
                        employee
                            ? EmployeeController.update(employee.id)
                            : EmployeeController.store(),
                    );
                }}
            >
                <Heading
                    title={employee ? 'Editar trabajador' : 'Nuevo trabajador'}
                />
                <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Input
                            id="dni"
                            value={data.dni}
                            onChange={(e) => setData('dni', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="hired_on">Fecha de ingreso</Label>
                        <Input
                            id="hired_on"
                            type="date"
                            value={data.hired_on}
                            onChange={(e) =>
                                setData('hired_on', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="position">Cargo</Label>
                        <NativeSelect
                            id="position"
                            value={data.position}
                            options={positions}
                            onChange={(e) =>
                                setData('position', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="user_id">Cuenta en la plataforma</Label>
                        <NativeSelect
                            id="user_id"
                            value={data.user_id}
                            placeholder="Sin cuenta"
                            options={accounts}
                            onChange={(e) =>
                                setData(
                                    'user_id',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : '',
                                )
                            }
                        />
                        <InputError message={errors.user_id} />
                    </div>
                </section>
                <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="regime">Régimen</Label>
                        <NativeSelect
                            id="regime"
                            value={data.regime}
                            options={regimes}
                            onChange={(e) => setData('regime', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pension_system">
                            Sistema de pensiones
                        </Label>
                        <NativeSelect
                            id="pension_system"
                            value={data.pension_system}
                            disabled={data.regime !== 'planilla'}
                            options={[
                                { value: 'onp', label: 'ONP' },
                                { value: 'afp', label: 'AFP' },
                                { value: 'ninguno', label: 'Ninguno' },
                            ]}
                            onChange={(e) =>
                                setData('pension_system', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="base_salary">Sueldo mensual (S/)</Label>
                        <Input
                            id="base_salary"
                            type="number"
                            min={0}
                            step="0.01"
                            value={data.base_salary}
                            onChange={(e) =>
                                setData('base_salary', e.target.value)
                            }
                        />
                        <InputError message={errors.base_salary} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bank">Banco</Label>
                        <Input
                            id="bank"
                            value={data.bank}
                            onChange={(e) => setData('bank', e.target.value)}
                            placeholder="BCP, Interbank, Caja Ica…"
                        />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="account_number">
                            N° de cuenta o celular Yape
                        </Label>
                        <Input
                            id="account_number"
                            value={data.account_number}
                            onChange={(e) =>
                                setData('account_number', e.target.value)
                            }
                        />
                    </div>
                    <label className="flex items-center gap-3 text-sm">
                        <Checkbox
                            checked={data.active}
                            onCheckedChange={(c) =>
                                setData('active', c === true)
                            }
                        />{' '}
                        Activo (entra en la planilla)
                    </label>
                </section>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" asChild>
                        <Link href={index()}>Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        Guardar
                    </Button>
                </div>
            </form>
        </>
    );
}

EmployeeForm.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Trabajadores', href: index() },
        { title: props.employee?.name ?? 'Nuevo', href: index() },
    ],
});
