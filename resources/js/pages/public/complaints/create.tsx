import { Head, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import ComplaintController from '@/actions/App/Http/Controllers/ComplaintController';
import InputError from '@/components/input-error';
import { textareaClass } from '@/components/school/block-editor';
import { PublicLayout } from '@/components/school/public-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Provider } from '@/types';

type Props = {
    provider: Provider;
    today: string;
    responseDays: number;
};

type Form = {
    type: 'reclamo' | 'queja';
    consumer_name: string;
    consumer_document_type: 'DNI' | 'CE' | 'Pasaporte';
    consumer_document_number: string;
    consumer_address: string;
    consumer_phone: string;
    consumer_email: string;
    is_minor: boolean;
    guardian_name: string;
    guardian_document_number: string;
    item_type: 'producto' | 'servicio';
    item_description: string;
    amount: string;
    detail: string;
    request: string;
    accepted: boolean;
};

function Field({
    id,
    label,
    error,
    children,
    className,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('grid gap-2', className)}>
            <Label htmlFor={id}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function Choice<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T;
    options: { value: T; label: string; hint?: string }[];
    onChange: (value: T) => void;
}) {
    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'rounded-xl border-2 p-3 text-left transition',
                        value === option.value
                            ? 'border-green-600 bg-green-50'
                            : 'border-slate-200 bg-white hover:border-slate-300',
                    )}
                >
                    <span className="block font-semibold">{option.label}</span>
                    {option.hint && (
                        <span className="text-xs text-slate-500">
                            {option.hint}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

export default function ComplaintCreate({
    provider,
    today,
    responseDays,
}: Props) {
    const form = useForm<Form>({
        type: 'reclamo',
        consumer_name: '',
        consumer_document_type: 'DNI',
        consumer_document_number: '',
        consumer_address: '',
        consumer_phone: '',
        consumer_email: '',
        is_minor: false,
        guardian_name: '',
        guardian_document_number: '',
        item_type: 'servicio',
        item_description: '',
        amount: '',
        detail: '',
        request: '',
        accepted: false,
    });
    const { data, setData, errors, processing } = form;

    return (
        <PublicLayout>
            <Head title="Libro de Reclamaciones" />

            <form
                className="space-y-8"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.submit(ComplaintController.store());
                }}
            >
                <header className="space-y-2">
                    <p className="text-sm font-medium text-green-700">
                        Conforme al Código de Protección y Defensa del
                        Consumidor
                    </p>
                    <h1 className="font-display text-3xl font-bold text-slate-900">
                        📕 Libro de Reclamaciones Virtual
                    </h1>
                    <div className="grid gap-1 rounded-xl bg-white p-4 text-sm shadow-sm sm:grid-cols-2">
                        <span>
                            <strong>Razón social:</strong> {provider.legal_name}
                        </span>
                        <span>
                            <strong>RUC:</strong> {provider.ruc}
                        </span>
                        <span>
                            <strong>Dirección:</strong> {provider.address}
                        </span>
                        <span>
                            <strong>Fecha:</strong>{' '}
                            {new Date(`${today}T00:00:00`).toLocaleDateString(
                                'es-PE',
                            )}
                        </span>
                    </div>
                </header>

                <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">
                        1. Identificación del consumidor reclamante
                    </h2>
                    <Field
                        id="consumer_name"
                        label="Nombre completo"
                        error={errors.consumer_name}
                    >
                        <Input
                            id="consumer_name"
                            value={data.consumer_name}
                            onChange={(e) =>
                                setData('consumer_name', e.target.value)
                            }
                            autoComplete="name"
                        />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                        <Field
                            id="consumer_document_type"
                            label="Documento"
                            error={errors.consumer_document_type}
                        >
                            <select
                                id="consumer_document_type"
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                value={data.consumer_document_type}
                                onChange={(e) =>
                                    setData(
                                        'consumer_document_type',
                                        e.target
                                            .value as Form['consumer_document_type'],
                                    )
                                }
                            >
                                <option value="DNI">DNI</option>
                                <option value="CE">Carné de extranjería</option>
                                <option value="Pasaporte">Pasaporte</option>
                            </select>
                        </Field>
                        <Field
                            id="consumer_document_number"
                            label="Número de documento"
                            error={errors.consumer_document_number}
                        >
                            <Input
                                id="consumer_document_number"
                                inputMode="numeric"
                                value={data.consumer_document_number}
                                onChange={(e) =>
                                    setData(
                                        'consumer_document_number',
                                        e.target.value,
                                    )
                                }
                            />
                        </Field>
                    </div>
                    <Field
                        id="consumer_address"
                        label="Domicilio"
                        error={errors.consumer_address}
                    >
                        <Input
                            id="consumer_address"
                            value={data.consumer_address}
                            onChange={(e) =>
                                setData('consumer_address', e.target.value)
                            }
                            autoComplete="street-address"
                        />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            id="consumer_phone"
                            label="Teléfono"
                            error={errors.consumer_phone}
                        >
                            <Input
                                id="consumer_phone"
                                type="tel"
                                value={data.consumer_phone}
                                onChange={(e) =>
                                    setData('consumer_phone', e.target.value)
                                }
                                autoComplete="tel"
                            />
                        </Field>
                        <Field
                            id="consumer_email"
                            label="Correo electrónico (recibirás aquí la constancia)"
                            error={errors.consumer_email}
                        >
                            <Input
                                id="consumer_email"
                                type="email"
                                value={data.consumer_email}
                                onChange={(e) =>
                                    setData('consumer_email', e.target.value)
                                }
                                autoComplete="email"
                            />
                        </Field>
                    </div>
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="is_minor"
                            checked={data.is_minor}
                            onCheckedChange={(checked) =>
                                setData('is_minor', checked === true)
                            }
                        />
                        <Label htmlFor="is_minor">
                            El reclamante es menor de edad
                        </Label>
                    </div>
                    {data.is_minor && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                id="guardian_name"
                                label="Nombre del padre, madre o apoderado"
                                error={errors.guardian_name}
                            >
                                <Input
                                    id="guardian_name"
                                    value={data.guardian_name}
                                    onChange={(e) =>
                                        setData('guardian_name', e.target.value)
                                    }
                                />
                            </Field>
                            <Field
                                id="guardian_document_number"
                                label="DNI del padre, madre o apoderado"
                                error={errors.guardian_document_number}
                            >
                                <Input
                                    id="guardian_document_number"
                                    value={data.guardian_document_number}
                                    onChange={(e) =>
                                        setData(
                                            'guardian_document_number',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </div>
                    )}
                </section>

                <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">
                        2. Identificación del bien contratado
                    </h2>
                    <Choice
                        value={data.item_type}
                        onChange={(value) => setData('item_type', value)}
                        options={[
                            { value: 'servicio', label: 'Servicio' },
                            { value: 'producto', label: 'Producto' },
                        ]}
                    />
                    <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
                        <Field
                            id="item_description"
                            label="Descripción"
                            error={errors.item_description}
                        >
                            <Input
                                id="item_description"
                                value={data.item_description}
                                onChange={(e) =>
                                    setData('item_description', e.target.value)
                                }
                                placeholder="Ej. Pensión de octubre, guardería"
                            />
                        </Field>
                        <Field
                            id="amount"
                            label="Monto reclamado (S/)"
                            error={errors.amount}
                        >
                            <Input
                                id="amount"
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.amount}
                                onChange={(e) =>
                                    setData('amount', e.target.value)
                                }
                            />
                        </Field>
                    </div>
                </section>

                <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">
                        3. Detalle de la reclamación y pedido del consumidor
                    </h2>
                    <Choice
                        value={data.type}
                        onChange={(value) => setData('type', value)}
                        options={[
                            {
                                value: 'reclamo',
                                label: 'Reclamo',
                                hint: 'Disconformidad relacionada a los productos o servicios.',
                            },
                            {
                                value: 'queja',
                                label: 'Queja',
                                hint: 'Disconformidad no relacionada a los productos o servicios; o malestar respecto a la atención al público.',
                            },
                        ]}
                    />
                    <Field id="detail" label="Detalle" error={errors.detail}>
                        <textarea
                            id="detail"
                            className={textareaClass}
                            value={data.detail}
                            onChange={(e) => setData('detail', e.target.value)}
                        />
                    </Field>
                    <Field id="request" label="Pedido" error={errors.request}>
                        <textarea
                            id="request"
                            className={textareaClass}
                            value={data.request}
                            onChange={(e) => setData('request', e.target.value)}
                        />
                    </Field>
                </section>

                <section className="space-y-4 rounded-2xl bg-white p-6 text-sm shadow-sm">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="accepted"
                            checked={data.accepted}
                            onCheckedChange={(checked) =>
                                setData('accepted', checked === true)
                            }
                        />
                        <Label htmlFor="accepted" className="leading-snug">
                            Declaro que los datos consignados son correctos y
                            autorizo su uso para atender mi reclamo o queja.
                        </Label>
                    </div>
                    <InputError message={errors.accepted} />
                    <p className="text-slate-500">
                        La formulación del reclamo no impide acudir a otras vías
                        de solución de controversias ni es requisito previo para
                        interponer una denuncia ante el INDECOPI. El proveedor
                        deberá dar respuesta en un plazo no mayor a{' '}
                        {responseDays} días hábiles.
                    </p>
                    <Button type="submit" size="lg" disabled={processing}>
                        Enviar hoja de reclamación
                    </Button>
                </section>
            </form>
        </PublicLayout>
    );
}
