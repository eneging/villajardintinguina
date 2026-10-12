import { Head, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardList,
    MessageCircle,
    PartyPopper,
} from 'lucide-react';
import { useState } from 'react';
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
import { store } from '@/routes/admission';
import type { SiteAdmission, SiteContact } from '@/types';

type Props = {
    content: {
        admission: SiteAdmission;
        levels: string[];
        contact: SiteContact;
    };
};

const textareaClass =
    'min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

export default function Admission({ content }: Props) {
    const { school } = usePage().props;
    const { admission } = content;
    const [sent, setSent] = useState(false);
    const form = useForm({
        parent_name: '',
        phone: '',
        email: '',
        child_name: '',
        child_birth_date: '',
        level_interest: '',
        message: '',
        privacy: false,
        website: '',
    });
    const { data, setData, errors, processing } = form;

    return (
        <PublicLayout width="full">
            <Head title="Admisión" />
            <PageHero
                title={admission.title}
                subtitle={admission.text}
                emoji="🎒"
            />

            <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 lg:grid-cols-[1fr_1.2fr]">
                <div className="space-y-6">
                    {admission.steps.length > 0 && (
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 font-display text-xl font-bold">
                                ¿Cómo es el proceso?
                            </h2>
                            <ol className="space-y-3">
                                {admission.steps.map((step, index) => (
                                    <li key={step} className="flex gap-3">
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                                            {index + 1}
                                        </span>
                                        <span className="text-slate-700">
                                            {step}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                    {admission.requirements.length > 0 && (
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
                                <ClipboardList className="size-5 text-amber-500" />
                                Requisitos
                            </h2>
                            <ul className="space-y-2">
                                {admission.requirements.map((requirement) => (
                                    <li
                                        key={requirement}
                                        className="flex gap-2 text-slate-700"
                                    >
                                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                                        {requirement}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <a
                        href={whatsappLink(
                            school.whatsapp,
                            'Hola, quisiera información sobre vacantes en Villa Jardín.',
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-3xl bg-[#25d366] p-4 font-semibold text-white shadow-sm hover:brightness-95"
                    >
                        <MessageCircle className="size-5" /> ¿Prefieres
                        WhatsApp? Escríbenos
                    </a>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
                    {sent ? (
                        <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
                            <PartyPopper className="size-14 text-amber-500" />
                            <h2 className="font-display text-2xl font-bold">
                                ¡Gracias por escribirnos!
                            </h2>
                            <p className="max-w-sm text-slate-600">
                                Recibimos tus datos. La dirección te llamará o
                                escribirá por WhatsApp para agendar la visita.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setSent(false)}
                            >
                                Enviar otra solicitud
                            </Button>
                        </div>
                    ) : !admission.open ? (
                        <div className="py-10 text-center text-slate-600">
                            <p className="font-display text-2xl font-bold text-slate-900">
                                Vacantes completas por ahora
                            </p>
                            <p className="mt-2">
                                Escríbenos por WhatsApp para entrar en la lista
                                de espera.
                            </p>
                        </div>
                    ) : (
                        <form
                            className="grid gap-4 sm:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.submit(store(), {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        form.reset();
                                        setSent(true);
                                    },
                                });
                            }}
                        >
                            <h2 className="font-display text-2xl font-bold sm:col-span-2">
                                Solicita información
                            </h2>
                            {/* Campo trampa para bots, oculto a las personas. */}
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
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="parent_name">
                                    Nombre del padre, madre o apoderado
                                </Label>
                                <Input
                                    id="parent_name"
                                    required
                                    value={data.parent_name}
                                    onChange={(e) =>
                                        setData('parent_name', e.target.value)
                                    }
                                />
                                <InputError message={errors.parent_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">
                                    Celular / WhatsApp
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    required
                                    placeholder="987 654 321"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                />
                                <InputError message={errors.phone} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Correo (opcional)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-2">
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
                            <div className="grid gap-2">
                                <Label htmlFor="child_birth_date">
                                    Fecha de nacimiento
                                </Label>
                                <Input
                                    id="child_birth_date"
                                    type="date"
                                    value={data.child_birth_date}
                                    onChange={(e) =>
                                        setData(
                                            'child_birth_date',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={errors.child_birth_date} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="level_interest">
                                    Nivel de interés
                                </Label>
                                <NativeSelect
                                    id="level_interest"
                                    value={data.level_interest}
                                    placeholder="Aún no lo sé"
                                    options={content.levels.map((level) => ({
                                        value: level,
                                        label: level,
                                    }))}
                                    onChange={(e) =>
                                        setData(
                                            'level_interest',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="message">
                                    ¿Algo que quieras contarnos?
                                </Label>
                                <textarea
                                    id="message"
                                    className={textareaClass}
                                    value={data.message}
                                    onChange={(e) =>
                                        setData('message', e.target.value)
                                    }
                                />
                                <InputError message={errors.message} />
                            </div>
                            <label className="flex items-start gap-3 text-sm text-slate-600 sm:col-span-2">
                                <Checkbox
                                    checked={data.privacy}
                                    onCheckedChange={(checked) =>
                                        setData('privacy', checked === true)
                                    }
                                    className="mt-0.5"
                                />
                                Autorizo a EP Villa Jardín a usar mis datos solo
                                para contactarme sobre el proceso de admisión
                                (Ley N° 29733).
                            </label>
                            <InputError
                                message={errors.privacy}
                                className="sm:col-span-2"
                            />
                            <Button
                                type="submit"
                                size="lg"
                                disabled={processing}
                                className="rounded-full bg-green-600 hover:bg-green-700 sm:col-span-2"
                            >
                                Enviar solicitud
                            </Button>
                        </form>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
