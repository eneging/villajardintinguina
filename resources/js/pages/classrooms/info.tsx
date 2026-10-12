import { Form, Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import ClassroomInfoController from '@/actions/App/Http/Controllers/ClassroomInfoController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { ActivityList } from '@/components/school/classroom-info';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as classrooms, show } from '@/routes/classrooms';
import type { ClassroomActivity, ClassroomInfo, Option } from '@/types';

type Props = {
    classroom: {
        id: number;
        name: string;
        color: string;
        mascot: string | null;
    };
    info: ClassroomInfo;
    activities: ClassroomActivity[];
    weekdays: Record<string, string>;
    activityTypes: Option[];
};

type InfoForm = {
    schedule: { time: string; activity: string }[];
    supplies: { item: string; quantity: string }[];
    weekly_menu: Record<string, { snack: string; lunch: string }>;
    menu_week_of: string;
};

export default function ClassroomInfoPage({
    classroom,
    info,
    activities,
    weekdays,
    activityTypes,
}: Props) {
    const form = useForm<InfoForm>({
        schedule: info.schedule,
        supplies: info.supplies.map((s) => ({
            item: s.item,
            quantity: s.quantity ?? '',
        })),
        weekly_menu: Object.fromEntries(
            Object.keys(weekdays).map((day) => [
                day,
                {
                    snack: info.weekly_menu[day]?.snack ?? '',
                    lunch: info.weekly_menu[day]?.lunch ?? '',
                },
            ]),
        ),
        menu_week_of: info.menu_week_of ?? '',
    });
    const { data, setData, processing } = form;
    const errors = form.errors as Record<string, string | undefined>;

    return (
        <>
            <Head title={`Información · ${classroom.name}`} />
            <div className="mx-auto w-full max-w-4xl space-y-8 p-4">
                <Heading
                    title={`${classroom.mascot ?? ''} Información del salón ${classroom.name}`}
                    description="Lo que las familias ven en la página del salón: horario, menú, útiles y calendario."
                />

                <form
                    className="space-y-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.submit(
                            ClassroomInfoController.update(classroom.id),
                            { preserveScroll: true },
                        );
                    }}
                >
                    <section className="space-y-3 rounded-2xl border bg-card p-5">
                        <h2 className="font-semibold">🕘 Un día en el salón</h2>
                        {data.schedule.map((slot, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    className="w-28"
                                    placeholder="8:15"
                                    aria-label="Hora"
                                    value={slot.time}
                                    onChange={(e) =>
                                        setData(
                                            'schedule',
                                            data.schedule.map((s, i) =>
                                                i === index
                                                    ? {
                                                          ...s,
                                                          time: e.target.value,
                                                      }
                                                    : s,
                                            ),
                                        )
                                    }
                                />
                                <Input
                                    placeholder="Recepción y juego libre"
                                    aria-label="Actividad"
                                    value={slot.activity}
                                    onChange={(e) =>
                                        setData(
                                            'schedule',
                                            data.schedule.map((s, i) =>
                                                i === index
                                                    ? {
                                                          ...s,
                                                          activity:
                                                              e.target.value,
                                                      }
                                                    : s,
                                            ),
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Quitar"
                                    onClick={() =>
                                        setData(
                                            'schedule',
                                            data.schedule.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                        <InputError
                            message={
                                Object.entries(errors).find(([key]) =>
                                    key.startsWith('schedule'),
                                )?.[1]
                            }
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setData('schedule', [
                                    ...data.schedule,
                                    { time: '', activity: '' },
                                ])
                            }
                        >
                            <Plus /> Agregar momento
                        </Button>
                    </section>

                    <section className="space-y-3 rounded-2xl border bg-card p-5">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <h2 className="font-semibold">🍲 Menú semanal</h2>
                            <div className="grid gap-1">
                                <Label htmlFor="menu_week_of">Semana del</Label>
                                <Input
                                    id="menu_week_of"
                                    type="date"
                                    value={data.menu_week_of}
                                    onChange={(e) =>
                                        setData('menu_week_of', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-3">
                            {Object.entries(weekdays).map(([day, label]) => (
                                <div
                                    key={day}
                                    className="grid items-center gap-2 sm:grid-cols-[6rem_1fr_1fr]"
                                >
                                    <span className="text-sm font-medium">
                                        {label}
                                    </span>
                                    <Input
                                        placeholder="Refrigerio: fruta picada"
                                        aria-label={`Refrigerio del ${label}`}
                                        value={data.weekly_menu[day].snack}
                                        onChange={(e) =>
                                            setData('weekly_menu', {
                                                ...data.weekly_menu,
                                                [day]: {
                                                    ...data.weekly_menu[day],
                                                    snack: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                    <Input
                                        placeholder="Almuerzo (guardería)"
                                        aria-label={`Almuerzo del ${label}`}
                                        value={data.weekly_menu[day].lunch}
                                        onChange={(e) =>
                                            setData('weekly_menu', {
                                                ...data.weekly_menu,
                                                [day]: {
                                                    ...data.weekly_menu[day],
                                                    lunch: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3 rounded-2xl border bg-card p-5">
                        <h2 className="font-semibold">✏️ Lista de útiles</h2>
                        {data.supplies.map((supply, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    placeholder="Cuaderno cuadriculado A4"
                                    aria-label="Útil"
                                    value={supply.item}
                                    onChange={(e) =>
                                        setData(
                                            'supplies',
                                            data.supplies.map((s, i) =>
                                                i === index
                                                    ? {
                                                          ...s,
                                                          item: e.target.value,
                                                      }
                                                    : s,
                                            ),
                                        )
                                    }
                                />
                                <Input
                                    className="w-32"
                                    placeholder="2 unid."
                                    aria-label="Cantidad"
                                    value={supply.quantity}
                                    onChange={(e) =>
                                        setData(
                                            'supplies',
                                            data.supplies.map((s, i) =>
                                                i === index
                                                    ? {
                                                          ...s,
                                                          quantity:
                                                              e.target.value,
                                                      }
                                                    : s,
                                            ),
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Quitar"
                                    onClick={() =>
                                        setData(
                                            'supplies',
                                            data.supplies.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setData('supplies', [
                                    ...data.supplies,
                                    { item: '', quantity: '' },
                                ])
                            }
                        >
                            <Plus /> Agregar útil
                        </Button>
                    </section>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            Guardar información
                        </Button>
                    </div>
                </form>

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <h2 className="font-semibold">
                        📅 Calendario de actividades
                    </h2>
                    <Form
                        {...ClassroomInfoController.storeActivity.form(
                            classroom.id,
                        )}
                        options={{ preserveScroll: true }}
                        resetOnSuccess
                        className="grid gap-3 sm:grid-cols-[10rem_12rem_1fr]"
                    >
                        {({ errors: activityErrors, processing: saving }) => (
                            <>
                                <div className="grid gap-1">
                                    <Label htmlFor="activity-date">Fecha</Label>
                                    <Input
                                        id="activity-date"
                                        name="date"
                                        type="date"
                                    />
                                    <InputError message={activityErrors.date} />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="activity-type">Tipo</Label>
                                    <NativeSelect
                                        id="activity-type"
                                        name="type"
                                        options={activityTypes}
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="activity-title">
                                        Actividad
                                    </Label>
                                    <Input
                                        id="activity-title"
                                        name="title"
                                        placeholder="Paseo a la granja"
                                    />
                                    <InputError
                                        message={activityErrors.title}
                                    />
                                </div>
                                <Input
                                    name="description"
                                    placeholder="Detalle para las familias (opcional): traer gorro y bloqueador"
                                    className="sm:col-span-2"
                                />
                                <Button type="submit" disabled={saving}>
                                    <Plus /> Agregar
                                </Button>
                            </>
                        )}
                    </Form>
                    <ActivityList
                        activities={activities}
                        onDelete={(activity) =>
                            confirm(`¿Quitar «${activity.title}»?`) &&
                            router.delete(
                                ClassroomInfoController.destroyActivity.url(
                                    activity.id,
                                ),
                                { preserveScroll: true },
                            )
                        }
                    />
                </section>
            </div>
        </>
    );
}

ClassroomInfoPage.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Salones', href: classrooms() },
        { title: props.classroom.name, href: show(props.classroom.id) },
        { title: 'Información', href: show(props.classroom.id) },
    ],
});
