import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import ClassroomController from '@/actions/App/Http/Controllers/Admin/ClassroomController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { textareaClass } from '@/components/school/block-editor';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index, show } from '@/routes/classrooms';

type NumberOption = { value: number; label: string };
type StaffRole = 'titular' | 'auxiliar' | 'practicante';
type Staff = { user_id: number | ''; role: StaffRole };

type Props = {
    classroom: {
        id: number;
        name: string;
        level_id: number;
        shift: string;
        capacity: number;
        color: string;
        mascot: string | null;
        description: string | null;
        staff: Staff[];
    } | null;
    levels: NumberOption[];
    staffOptions: NumberOption[];
};

const mascots = [
    '🐣',
    '🐥',
    '🐻',
    '🦁',
    '🐰',
    '🐼',
    '🦊',
    '🐸',
    '🐝',
    '🦋',
    '🐢',
    '🐬',
];

export default function ClassroomForm({
    classroom,
    levels,
    staffOptions,
}: Props) {
    const form = useForm({
        name: classroom?.name ?? '',
        level_id: classroom?.level_id ?? levels[0]?.value ?? '',
        shift: classroom?.shift ?? 'mañana',
        capacity: classroom?.capacity ?? 20,
        color: classroom?.color ?? '#22c55e',
        mascot: classroom?.mascot ?? '🐣',
        description: classroom?.description ?? '',
        staff: classroom?.staff ?? ([] as Staff[]),
    });
    const { data, setData, errors, processing } = form;
    const allErrors = errors as Record<string, string | undefined>;

    return (
        <>
            <Head
                title={classroom ? `Editar ${classroom.name}` : 'Nuevo salón'}
            />
            <form
                className="mx-auto w-full max-w-2xl space-y-6 p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.submit(
                        classroom
                            ? ClassroomController.update(classroom.id)
                            : ClassroomController.store(),
                    );
                }}
            >
                <Heading
                    title={classroom ? 'Editar salón' : 'Nuevo salón'}
                    description="Nombre, mascota, color y personal a cargo."
                />

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Patitos"
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="level_id">Nivel</Label>
                            <NativeSelect
                                id="level_id"
                                value={data.level_id}
                                options={levels}
                                onChange={(e) =>
                                    setData('level_id', Number(e.target.value))
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shift">Turno</Label>
                            <NativeSelect
                                id="shift"
                                value={data.shift}
                                options={[
                                    { value: 'mañana', label: 'Mañana' },
                                    { value: 'tarde', label: 'Tarde' },
                                    {
                                        value: 'completo',
                                        label: 'Jornada completa',
                                    },
                                ]}
                                onChange={(e) =>
                                    setData('shift', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="capacity">Vacantes</Label>
                            <Input
                                id="capacity"
                                type="number"
                                min={1}
                                value={data.capacity}
                                onChange={(e) =>
                                    setData('capacity', Number(e.target.value))
                                }
                            />
                            <InputError message={errors.capacity} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Mascota y color</Label>
                        <div className="flex flex-wrap items-center gap-2">
                            {mascots.map((mascot) => (
                                <button
                                    key={mascot}
                                    type="button"
                                    onClick={() => setData('mascot', mascot)}
                                    className={`flex size-10 items-center justify-center rounded-full border-2 text-2xl ${data.mascot === mascot ? 'border-primary' : 'border-transparent'}`}
                                    style={{
                                        backgroundColor: `${data.color}2e`,
                                    }}
                                    aria-label={`Mascota ${mascot}`}
                                >
                                    {mascot}
                                </button>
                            ))}
                            <input
                                type="color"
                                aria-label="Color del salón"
                                value={data.color}
                                onChange={(e) =>
                                    setData('color', e.target.value)
                                }
                                className="size-10 cursor-pointer rounded-full border"
                            />
                        </div>
                        <InputError message={errors.color} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">
                            Presentación para los padres
                        </Label>
                        <textarea
                            id="description"
                            className={textareaClass}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                    </div>
                </section>

                <section className="space-y-3 rounded-2xl border bg-card p-5">
                    <Heading
                        variant="small"
                        title="Personal del salón"
                        description="La maestra titular y la auxiliar pueden publicar módulos; la practicante solo ve."
                    />
                    {data.staff.map((member, i) => (
                        <div key={i} className="flex gap-2">
                            <NativeSelect
                                aria-label="Persona"
                                value={member.user_id}
                                placeholder="Elige una persona"
                                options={staffOptions}
                                onChange={(e) =>
                                    setData(
                                        'staff',
                                        data.staff.map((m, idx) =>
                                            idx === i
                                                ? {
                                                      ...m,
                                                      user_id: e.target.value
                                                          ? Number(
                                                                e.target.value,
                                                            )
                                                          : '',
                                                  }
                                                : m,
                                        ),
                                    )
                                }
                            />
                            <NativeSelect
                                aria-label="Rol en el salón"
                                className="w-40"
                                value={member.role}
                                options={[
                                    { value: 'titular', label: 'Titular' },
                                    { value: 'auxiliar', label: 'Auxiliar' },
                                    {
                                        value: 'practicante',
                                        label: 'Practicante',
                                    },
                                ]}
                                onChange={(e) =>
                                    setData(
                                        'staff',
                                        data.staff.map((m, idx) =>
                                            idx === i
                                                ? {
                                                      ...m,
                                                      role: e.target
                                                          .value as StaffRole,
                                                  }
                                                : m,
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
                                        'staff',
                                        data.staff.filter(
                                            (_, idx) => idx !== i,
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
                            Object.entries(allErrors).find(([key]) =>
                                key.startsWith('staff'),
                            )?.[1]
                        }
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setData('staff', [
                                ...data.staff,
                                { user_id: '', role: 'titular' },
                            ])
                        }
                    >
                        <Plus /> Agregar persona
                    </Button>
                </section>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" asChild>
                        <Link href={classroom ? show(classroom.id) : index()}>
                            Cancelar
                        </Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        Guardar
                    </Button>
                </div>
            </form>
        </>
    );
}

ClassroomForm.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Salones', href: index() },
        {
            title: props.classroom ? props.classroom.name : 'Nuevo salón',
            href: index(),
        },
    ],
});
