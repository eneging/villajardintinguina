import { useForm } from '@inertiajs/react';
import type { UrlMethodPair } from '@inertiajs/core';
import { useState } from 'react';
import { day, money } from '@/components/billing/format';
import InputError from '@/components/input-error';
import { MediaUploader } from '@/components/school/media-uploader';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localToday } from '@/lib/school';
import type { Charge, MediaItem, Option } from '@/types';

type PayableCharge = Charge & { student?: string };

/**
 * Formulario de pago: la administradora registra el pago (con boleta/factura)
 * y el padre reporta su pago con la foto del voucher.
 */
export function PaymentForm({
    charges,
    methods,
    action,
    mode,
    cloudinaryEnabled,
    onDone,
}: {
    charges: PayableCharge[];
    methods: Option[];
    action: UrlMethodPair;
    mode: 'admin' | 'parent';
    cloudinaryEnabled: boolean;
    onDone?: () => void;
}) {
    const payable = charges.filter(
        (c) => c.balance > 0 && c.status !== 'anulada',
    );
    const [voucher, setVoucher] = useState<MediaItem | null>(null);
    const [receipt, setReceipt] = useState<MediaItem | null>(null);
    const form = useForm({
        charge_ids: payable
            .filter((c) => c.status === 'vencida')
            .map((c) => c.id),
        amount: payable
            .filter((c) => c.status === 'vencida')
            .reduce((sum, c) => sum + c.balance, 0)
            .toFixed(2),
        paid_on: localToday(),
        method: mode === 'admin' ? 'efectivo' : 'yape',
        operation_number: '',
        voucher_media_id: null as number | null,
        receipt_type: mode === 'admin' ? 'boleta' : '',
        receipt_number: '',
        receipt_media_id: null as number | null,
        notes: '',
    });
    const { data, setData, errors, processing } = form;
    const allErrors = errors as Record<string, string | undefined>;

    function toggle(charge: PayableCharge, checked: boolean) {
        const ids = checked
            ? [...data.charge_ids, charge.id]
            : data.charge_ids.filter((id) => id !== charge.id);
        const total = payable
            .filter((c) => ids.includes(c.id))
            .reduce((sum, c) => sum + c.balance, 0);
        setData((values) => ({
            ...values,
            charge_ids: ids,
            amount: total.toFixed(2),
        }));
    }

    if (payable.length === 0) {
        return (
            <p className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
                🎉 No hay cuotas pendientes.
            </p>
        );
    }

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                form.submit(action, {
                    preserveScroll: true,
                    onSuccess: () => {
                        form.reset();
                        setVoucher(null);
                        setReceipt(null);
                        onDone?.();
                    },
                });
            }}
        >
            <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-medium">
                    ¿Qué cuotas paga?
                </legend>
                {payable.map((charge) => (
                    <label
                        key={charge.id}
                        className="flex items-center gap-3 rounded-lg border p-2 text-sm"
                    >
                        <Checkbox
                            checked={data.charge_ids.includes(charge.id)}
                            onCheckedChange={(checked) =>
                                toggle(charge, checked === true)
                            }
                        />
                        <span className="flex-1">
                            {charge.description}
                            {charge.student && ` — ${charge.student}`}
                            <span className="text-muted-foreground">
                                {' '}
                                · vence {day(charge.due_on)}
                            </span>
                        </span>
                        <span className="font-medium">
                            {money(charge.balance)}
                        </span>
                    </label>
                ))}
                <InputError
                    message={errors.charge_ids ?? allErrors['charge_ids.0']}
                />
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                    <Label htmlFor="amount">Monto (S/)</Label>
                    <Input
                        id="amount"
                        type="number"
                        min={0}
                        step="0.01"
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                    />
                    <InputError message={errors.amount} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="method">Modalidad</Label>
                    <NativeSelect
                        id="method"
                        value={data.method}
                        options={methods}
                        onChange={(e) => setData('method', e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="paid_on">Fecha de pago</Label>
                    <Input
                        id="paid_on"
                        type="date"
                        value={data.paid_on}
                        onChange={(e) => setData('paid_on', e.target.value)}
                    />
                    <InputError message={errors.paid_on} />
                </div>
            </div>

            {data.method !== 'efectivo' && (
                <div className="grid gap-2">
                    <Label htmlFor="operation_number">N° de operación</Label>
                    <Input
                        id="operation_number"
                        value={data.operation_number}
                        onChange={(e) =>
                            setData('operation_number', e.target.value)
                        }
                    />
                    <InputError message={errors.operation_number} />
                </div>
            )}

            <div className="grid gap-2">
                <Label>
                    Foto del voucher {mode === 'admin' && '(opcional)'}
                </Label>
                {voucher?.thumbnail && (
                    <img
                        src={voucher.thumbnail}
                        alt="Voucher"
                        className="h-24 w-fit rounded-lg"
                    />
                )}
                <MediaUploader
                    target={{ context: 'payment' }}
                    resourceType="image"
                    label={voucher ? 'Cambiar voucher' : 'Subir voucher'}
                    disabled={!cloudinaryEnabled}
                    onUploaded={(media) => {
                        setVoucher(media);
                        setData('voucher_media_id', media.id);
                    }}
                />
                {!cloudinaryEnabled && (
                    <p className="text-xs text-muted-foreground">
                        La subida de fotos se activa al configurar Cloudinary.
                    </p>
                )}
                <InputError message={errors.voucher_media_id} />
            </div>

            {mode === 'admin' && (
                <div className="grid gap-4 rounded-xl bg-muted/40 p-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                        <Label htmlFor="receipt_type">Comprobante</Label>
                        <NativeSelect
                            id="receipt_type"
                            value={data.receipt_type}
                            placeholder="Sin comprobante"
                            options={[
                                { value: 'boleta', label: 'Boleta' },
                                { value: 'factura', label: 'Factura' },
                            ]}
                            onChange={(e) =>
                                setData('receipt_type', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="receipt_number">Serie y número</Label>
                        <Input
                            id="receipt_number"
                            placeholder="B001-000123"
                            value={data.receipt_number}
                            onChange={(e) =>
                                setData('receipt_number', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Foto o PDF del comprobante</Label>
                        <MediaUploader
                            target={{ context: 'payment' }}
                            resourceType="image"
                            label={
                                receipt ? 'Cambiar archivo' : 'Subir archivo'
                            }
                            disabled={!cloudinaryEnabled}
                            onUploaded={(media) => {
                                setReceipt(media);
                                setData('receipt_media_id', media.id);
                            }}
                        />
                        {receipt && (
                            <span className="text-xs text-green-700">
                                Archivo listo ✓
                            </span>
                        )}
                    </div>
                </div>
            )}

            <Button
                type="submit"
                disabled={processing || data.charge_ids.length === 0}
            >
                {mode === 'admin' ? 'Registrar pago' : 'Enviar voucher'}
            </Button>
        </form>
    );
}
