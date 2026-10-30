import { Head, useForm, usePage } from '@inertiajs/react';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import {
    PageHero,
    PublicLayout,
    whatsappLink,
} from '@/components/school/public-layout';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { store } from '@/routes/visit';

type Props = {
    slots: { id: number; starts_at: string }[];
    levels: string[];
};

const dayLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
});
const timeLabel = new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
});

export default function Visit({ slots, levels }: Props) {
    const { school } = usePage().props;
    const [done, setDone] = useState(false);
    const form = useForm({
        visit_slot_id: null as number | null,
        parent_name: '',
        phone: '',
        email: '',
        child_name: '',
        level_interest: '',
        notes: '',
        privacy: false,
        website: '',
    });
    const { data, setData, errors, processing } = form;
    const days = useMemo(() => {
        const groups = new Map<string, { id: number; starts_at: string }[]>();
        slots.forEach((slot) => {
            const key = slot.starts_at.slice(0, 10);
            groups.set(key, [...(groups.get(key) ?? []), slot]);
        });

        return [...groups.entries()];
    }, [slots]);

    return (
        <PublicLayout width="full">
            <Head title="Agenda tu visita" />
            <PageHero
                title="Agenda tu visita"
                subtitle="Ven a conocer las aulas, a las maestras y resolver tus dudas. La visita dura unos 30 minutos."
                emoji="🗓️"
            />
            <section className="mx-auto max-w-5xl px-4 pb-20">
                {done ? (
                    <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-10 text-center shadow-sm">
                        <CalendarCheck className="size-14 text-green-600" />
                        <h2 className="font-display text-2xl font-bold">
                            ¡Tu visita está agendada!
                        </h2>
                        <p className="max-w-md text-slate-600">
                            Te esperamos. Si necesitas cambiar la fecha,
                            escríbenos por WhatsApp.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setDone(false)}
                        >
                            Agendar otra visita
                        </Button>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="space-y-4 rounded-3xl bg-white p-10 text-center shadow-sm">
                        <p className="text-slate-600">
                            Por ahora no hay horarios disponibles en línea.
                        </p>
                        <a
                            href={whatsappLink(
                                school.whatsapp,
                                'Hola, quisiera agendar una visita a Villa Jardín.',
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-semibold text-white"
                        >
                            <MessageCircle className="size-5" /> Coordinar por
                            WhatsApp
                        </a>
                    </div>
                ) : (
                    <form
                        className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.submit(store(), {
                                preserveScroll: true,
                                onSuccess: () => {
                                    form.reset();
                                    setDone(true);
                                },
                            });
                        }}
                    >
                        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="font-display text-xl font-bold">
                                1. Elige el día y la hora
                            </h2>
                            {days.map(([date, daySlots]) => (
                                <div key={date} className="space-y-2">
                                    <p className="text-sm font-semibold first-letter:uppercase">
                                        {dayLabel.format(
                                            new Date(`${date}T00:00:00`),
                                        )}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {daySlots.map((slot) => (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                aria-pressed={
                                                    data.visit_slot_id ===
                                                    slot.id
                                                }
                                                onClick={() =>
                                                    setData(
                                                        'visit_slot_id',
                                                        slot.id,
                                                    )
                                                }
                                                className={cn(
                                                    'rounded-full border px-4 py-2 text-sm font-medium transition',
                                                    data.visit_slot_id ===
                                                        slot.id
                                                        ? 'border-green-600 bg-green-600 text-white'
                                                        : 'hover:border-green-600',
                                                )}
                                            >
                                                {timeLabel.format(
                                                    new Date(slot.starts_at),
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <InputError message={errors.visit_slot_id} />
                        </div>
                        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="font-display text-xl font-bold">
                                2. Tus datos
                            </h2>
                            <input
                                type="text"
                                name="website"
                                tabIndex={-1}
                                autoComplete="off"
                                className="hidden"
                                value={data.website}
                                onChange={(e) =>
                                    setData('website', e.target.value)
                                }
                            />
                            <div className="grid gap-1.5">
                                <Label htmlFor="parent_name">Tu nombre</Label>
                                <Input
                                    id="parent_name"
                                    value={data.parent_name}
                                    onChange={(e) =>
                                        setData('parent_name', e.target.value)
                                    }
                                />
                                <InputError message={errors.parent_name} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="phone">
                                    Celular / WhatsApp
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                />
                                <InputError message={errors.phone} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="child_name">
                                    Nombre del niño(a)
                                </Label>
                                <Input
                                    id="child_name"
                                    value={data.child_name}
                                    onChange={(e) =>
                                        setData('child_name', e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="level_interest">
                                    Nivel de interés
                                </Label>
                                <NativeSelect
                                    id="level_interest"
                                    value={data.level_interest}
                                    placeholder="Aún no lo sé"
                                    options={levels.map((l) => ({
                                        value: l,
                                        label: l,
                                    }))}
                                    onChange={(e) =>
                                        setData(
                                            'level_interest',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <label className="flex items-start gap-3 text-sm text-slate-600">
                                <Checkbox
                                    checked={data.privacy}
                                    onCheckedChange={(c) =>
                                        setData('privacy', c === true)
                                    }
                                    className="mt-0.5"
                                />
                                Autorizo a EP Villa Jardín a usar mis datos solo
                                para coordinar la visita (Ley N° 29733).
                            </label>
                            <InputError message={errors.privacy} />
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full rounded-full bg-green-600 hover:bg-green-700"
                                disabled={processing || !data.visit_slot_id}
                            >
                                Confirmar visita
                            </Button>
                        </div>
                    </form>
                )}
            </section>
        </PublicLayout>
    );
}
