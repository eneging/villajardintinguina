import { Form, Head, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import ServiceController from '@/actions/App/Http/Controllers/Admin/ServiceController';
import { money } from '@/components/billing/format';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { index } from '@/routes/admin/services';

type ServiceRow = {
    id: number;
    name: string;
    description: string | null;
    monthly_price: number;
    active: boolean;
    students: {
        enrollment_id: number;
        name: string;
        classroom: string;
        price: number | null;
    }[];
};

type Props = {
    services: ServiceRow[];
    enrollments: { value: number; label: string }[];
};

export default function Services({ services, enrollments }: Props) {
    return (
        <>
            <Head title="Servicios adicionales" />
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <Heading
                    title="Servicios adicionales"
                    description="Movilidad, almuerzo u horario extendido. Se cobran solos cada mes al generar las mensualidades."
                />

                <Form
                    {...ServiceController.store.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    className="grid gap-2 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_1fr_9rem_auto]"
                >
                    {({ errors, processing }) => (
                        <>
                            <Input
                                name="name"
                                placeholder="Movilidad escolar"
                                aria-label="Nombre"
                            />
                            <Input
                                name="description"
                                placeholder="Recojo y retorno a casa"
                                aria-label="Descripción"
                            />
                            <Input
                                name="monthly_price"
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="S/ al mes"
                                aria-label="Precio mensual"
                            />
                            <input type="hidden" name="active" value="1" />
                            <Button type="submit" disabled={processing}>
                                <Plus /> Crear
                            </Button>
                            <InputError
                                message={errors.name ?? errors.monthly_price}
                                className="sm:col-span-4"
                            />
                        </>
                    )}
                </Form>

                {services.map((service) => (
                    <section
                        key={service.id}
                        className="space-y-3 rounded-2xl border bg-card p-5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {service.name}{' '}
                                    {!service.active && (
                                        <Badge variant="secondary">
                                            Inactivo
                                        </Badge>
                                    )}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {money(service.monthly_price)} al mes
                                    {service.description &&
                                        ` · ${service.description}`}{' '}
                                    · {service.students.length} alumno(s)
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    router.put(
                                        ServiceController.update.url(
                                            service.id,
                                        ),
                                        {
                                            name: service.name,
                                            description: service.description,
                                            monthly_price:
                                                service.monthly_price,
                                            active: !service.active,
                                        },
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                {service.active ? 'Desactivar' : 'Activar'}
                            </Button>
                        </div>
                        {service.students.length > 0 && (
                            <ul className="divide-y rounded-xl border text-sm">
                                {service.students.map((student) => (
                                    <li
                                        key={student.enrollment_id}
                                        className="flex items-center justify-between gap-2 px-3 py-2"
                                    >
                                        <span>
                                            {student.name}{' '}
                                            <span className="text-muted-foreground">
                                                · {student.classroom}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <span className="tabular-nums">
                                                {money(
                                                    student.price ??
                                                        service.monthly_price,
                                                )}
                                            </span>
                                            <button
                                                type="button"
                                                aria-label={`Quitar a ${student.name}`}
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    router.delete(
                                                        ServiceController.detach.url(
                                                            [
                                                                service.id,
                                                                student.enrollment_id,
                                                            ],
                                                        ),
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Form
                            {...ServiceController.attach.form(service.id)}
                            options={{ preserveScroll: true }}
                            resetOnSuccess
                            className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <NativeSelect
                                        name="enrollment_id"
                                        placeholder="Agregar alumno…"
                                        options={enrollments}
                                        aria-label="Alumno"
                                    />
                                    <Input
                                        name="price"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        placeholder="Precio especial"
                                        aria-label="Precio especial"
                                    />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Agregar
                                    </Button>
                                    <InputError
                                        message={errors.enrollment_id}
                                        className="sm:col-span-3"
                                    />
                                </>
                            )}
                        </Form>
                    </section>
                ))}
            </div>
        </>
    );
}

Services.layout = {
    breadcrumbs: [{ title: 'Servicios adicionales', href: index() }],
};
