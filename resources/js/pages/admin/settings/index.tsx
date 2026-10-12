import { Form, Head, router, usePage } from '@inertiajs/react';
import { CalendarRange, Check, Plus, Tags, Trash2, Layers } from 'lucide-react';
import { useState } from 'react';
import SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import { day } from '@/components/billing/format';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/settings';

type Year = {
    id: number;
    year: number;
    starts_on: string;
    ends_on: string;
    is_active: boolean;
    classrooms_count: number;
    enrollments_count: number;
};

type Level = {
    id: number;
    name: string;
    min_age_months: number;
    max_age_months: number;
    position: number;
    classrooms_count: number;
};

type Category = { id: number; name: string; expenses_count: number };

type Props = { years: Year[]; levels: Level[]; categories: Category[] };

function ages(months: number): string {
    return months < 12
        ? `${months} m`
        : `${Math.floor(months / 12)} a${months % 12 ? ` ${months % 12} m` : ''}`;
}

function LevelRow({ level }: { level: Level }) {
    const [data, setData] = useState({
        name: level.name,
        min_age_months: String(level.min_age_months),
        max_age_months: String(level.max_age_months),
        position: String(level.position),
    });
    const dirty =
        data.name !== level.name ||
        data.min_age_months !== String(level.min_age_months) ||
        data.max_age_months !== String(level.max_age_months) ||
        data.position !== String(level.position);

    return (
        <li className="grid items-center gap-2 py-2 sm:grid-cols-[1fr_6rem_6rem_5rem_auto]">
            <Input
                aria-label="Nombre del nivel"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
            />
            <Input
                type="number"
                aria-label="Edad mínima en meses"
                title="Edad mínima (meses)"
                value={data.min_age_months}
                onChange={(e) =>
                    setData({ ...data, min_age_months: e.target.value })
                }
            />
            <Input
                type="number"
                aria-label="Edad máxima en meses"
                title="Edad máxima (meses)"
                value={data.max_age_months}
                onChange={(e) =>
                    setData({ ...data, max_age_months: e.target.value })
                }
            />
            <Input
                type="number"
                aria-label="Orden"
                title="Orden"
                value={data.position}
                onChange={(e) => setData({ ...data, position: e.target.value })}
            />
            <div className="flex gap-1">
                <Button
                    size="sm"
                    variant="outline"
                    disabled={!dirty}
                    onClick={() =>
                        router.put(
                            SettingsController.updateLevel.url(level.id),
                            data,
                            { preserveScroll: true },
                        )
                    }
                >
                    Guardar
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label={`Eliminar ${level.name}`}
                    disabled={level.classrooms_count > 0}
                    title={
                        level.classrooms_count > 0
                            ? 'Tiene salones'
                            : 'Eliminar'
                    }
                    onClick={() =>
                        confirm(`¿Eliminar el nivel ${level.name}?`) &&
                        router.delete(
                            SettingsController.destroyLevel.url(level.id),
                            { preserveScroll: true },
                        )
                    }
                >
                    <Trash2 />
                </Button>
            </div>
        </li>
    );
}

function CategoryRow({ category }: { category: Category }) {
    const [name, setName] = useState(category.name);

    return (
        <li className="flex items-center gap-2 py-2">
            <Input
                aria-label="Categoría"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <span className="w-24 shrink-0 text-xs text-muted-foreground">
                {category.expenses_count} gasto(s)
            </span>
            <Button
                size="sm"
                variant="outline"
                disabled={name === category.name}
                onClick={() =>
                    router.put(
                        SettingsController.updateCategory.url(category.id),
                        { name },
                        { preserveScroll: true },
                    )
                }
            >
                Guardar
            </Button>
            <Button
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label={`Eliminar ${category.name}`}
                disabled={category.expenses_count > 0}
                onClick={() =>
                    router.delete(
                        SettingsController.destroyCategory.url(category.id),
                        { preserveScroll: true },
                    )
                }
            >
                <Trash2 />
            </Button>
        </li>
    );
}

export default function Settings({ years, levels, categories }: Props) {
    const errors = usePage().props.errors as Record<string, string>;
    const active = years.find((year) => year.is_active);
    const nextYear = (years[0]?.year ?? new Date().getFullYear()) + 1;

    return (
        <>
            <Head title="Configuración" />
            <div className="mx-auto w-full max-w-4xl space-y-8 p-4">
                <Heading
                    title="Configuración del colegio"
                    description="Años escolares, niveles y categorías de gastos."
                />

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <CalendarRange className="size-5" /> Años escolares
                    </h2>
                    <ul className="divide-y">
                        {years.map((year) => (
                            <li
                                key={year.id}
                                className="flex flex-wrap items-center justify-between gap-2 py-3"
                            >
                                <div>
                                    <p className="font-medium">
                                        {year.year}{' '}
                                        {year.is_active && (
                                            <Badge className="ml-1">
                                                Activo
                                            </Badge>
                                        )}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {day(year.starts_on)} –{' '}
                                        {day(year.ends_on)} ·{' '}
                                        {year.classrooms_count} salones ·{' '}
                                        {year.enrollments_count} matrículas
                                    </p>
                                </div>
                                {!year.is_active && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            confirm(
                                                `¿Activar el año ${year.year}? Las matrículas, cuotas y salones pasarán a usar este año.`,
                                            ) &&
                                            router.post(
                                                SettingsController.activateYear.url(
                                                    year.id,
                                                ),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Check /> Activar
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                    <Form
                        {...SettingsController.storeYear.form()}
                        options={{ preserveScroll: true }}
                        className="grid gap-3 rounded-xl border border-dashed p-4 sm:grid-cols-3"
                    >
                        {({ errors: formErrors, processing }) => (
                            <>
                                <p className="font-medium sm:col-span-3">
                                    Preparar un nuevo año escolar
                                </p>
                                <div className="grid gap-1">
                                    <Label htmlFor="year">Año</Label>
                                    <Input
                                        id="year"
                                        name="year"
                                        type="number"
                                        defaultValue={nextYear}
                                    />
                                    <InputError message={formErrors.year} />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="starts_on">
                                        Inicio de clases
                                    </Label>
                                    <Input
                                        id="starts_on"
                                        name="starts_on"
                                        type="date"
                                        defaultValue={`${nextYear}-03-01`}
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="ends_on">
                                        Fin de clases
                                    </Label>
                                    <Input
                                        id="ends_on"
                                        name="ends_on"
                                        type="date"
                                        defaultValue={`${nextYear}-12-20`}
                                    />
                                    <InputError message={formErrors.ends_on} />
                                </div>
                                {active && (
                                    <>
                                        <label className="flex items-center gap-2 text-sm sm:col-span-3">
                                            <Checkbox
                                                name="copy_classrooms"
                                                value="1"
                                                defaultChecked
                                            />
                                            Copiar los {active.classrooms_count}{' '}
                                            salones de {active.year} (nombre,
                                            mascota, horario, útiles e
                                            inducción)
                                        </label>
                                        <label className="flex items-center gap-2 text-sm sm:col-span-3">
                                            <Checkbox
                                                name="copy_staff"
                                                value="1"
                                            />
                                            Mantener a las mismas maestras en
                                            cada salón
                                        </label>
                                    </>
                                )}
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="sm:col-span-3 sm:w-fit"
                                >
                                    <Plus /> Crear año
                                </Button>
                                <p className="text-xs text-muted-foreground sm:col-span-3">
                                    El año nuevo no se activa solo: actívalo
                                    cuando empiece la matrícula.
                                </p>
                            </>
                        )}
                    </Form>
                </section>

                <section className="space-y-3 rounded-2xl border bg-card p-5">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <Layers className="size-5" /> Niveles
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Nombre, edad mínima y máxima en meses, y orden.
                    </p>
                    <InputError message={errors.level} />
                    <ul className="divide-y">
                        {levels.map((level) => (
                            <LevelRow
                                key={`${level.id}-${level.name}-${level.position}`}
                                level={level}
                            />
                        ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                        {levels
                            .map(
                                (level) =>
                                    `${level.name}: ${ages(level.min_age_months)}–${ages(level.max_age_months)}`,
                            )
                            .join(' · ')}
                    </p>
                    <Form
                        {...SettingsController.storeLevel.form()}
                        options={{ preserveScroll: true }}
                        resetOnSuccess
                        className="grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto]"
                    >
                        {({ errors: formErrors, processing }) => (
                            <>
                                <Input name="name" placeholder="Nuevo nivel" />
                                <Input
                                    name="min_age_months"
                                    type="number"
                                    placeholder="Mín."
                                />
                                <Input
                                    name="max_age_months"
                                    type="number"
                                    placeholder="Máx."
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={processing}
                                >
                                    <Plus /> Agregar
                                </Button>
                                <InputError
                                    message={
                                        formErrors.name ??
                                        formErrors.max_age_months ??
                                        formErrors.min_age_months
                                    }
                                    className="sm:col-span-4"
                                />
                            </>
                        )}
                    </Form>
                </section>

                <section className="space-y-3 rounded-2xl border bg-card p-5">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <Tags className="size-5" /> Categorías de gastos
                    </h2>
                    <InputError message={errors.category} />
                    <ul className="divide-y">
                        {categories.map((category) => (
                            <CategoryRow
                                key={`${category.id}-${category.name}`}
                                category={category}
                            />
                        ))}
                    </ul>
                    <Form
                        {...SettingsController.storeCategory.form()}
                        options={{ preserveScroll: true }}
                        resetOnSuccess
                        className="flex gap-2"
                    >
                        {({ errors: formErrors, processing }) => (
                            <>
                                <div className="grid flex-1 gap-1">
                                    <Input
                                        name="name"
                                        placeholder="Nueva categoría (p. ej. Mantenimiento)"
                                    />
                                    <InputError message={formErrors.name} />
                                </div>
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={processing}
                                >
                                    <Plus /> Agregar
                                </Button>
                            </>
                        )}
                    </Form>
                </section>
            </div>
        </>
    );
}

Settings.layout = {
    breadcrumbs: [{ title: 'Configuración', href: index() }],
};
