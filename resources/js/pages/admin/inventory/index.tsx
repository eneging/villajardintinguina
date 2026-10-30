import { Form, Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownToLine,
    ArrowUpFromLine,
    Plus,
} from 'lucide-react';
import { useState } from 'react';
import InventoryController from '@/actions/App/Http/Controllers/Admin/InventoryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { index } from '@/routes/admin/inventory';
import type { Option } from '@/types';

type Item = {
    id: number;
    name: string;
    category: string;
    category_label: string;
    unit: string;
    quantity: number;
    min_quantity: number;
    location: string | null;
    low: boolean;
};

type Movement = {
    id: number;
    item: string;
    unit: string;
    type: 'entrada' | 'salida';
    quantity: number;
    reason: string | null;
    student: string | null;
    user: string | null;
    created_at: string;
};

type Props = {
    items: Item[];
    movements: Movement[];
    categories: Option[];
    students: { value: number; label: string }[];
};

const when = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
});
const qty = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });

export default function Inventory({
    items,
    movements,
    categories,
    students,
}: Props) {
    const [moving, setMoving] = useState<{
        item: Item;
        type: 'entrada' | 'salida';
    } | null>(null);
    const low = items.filter((item) => item.low);

    return (
        <>
            <Head title="Inventario" />
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="Inventario de materiales"
                    description="Material educativo, limpieza, cocina y botiquín. Registra entradas (compras o útiles que trajeron los niños) y salidas."
                />

                {low.length > 0 && (
                    <p className="flex gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        Por acabarse: {low.map((item) => item.name).join(', ')}.
                    </p>
                )}

                <Form
                    {...InventoryController.store.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    className="grid gap-2 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_11rem_7rem_7rem_7rem_auto]"
                >
                    {({ errors, processing }) => (
                        <>
                            <Input
                                name="name"
                                placeholder="Papel bond A4"
                                aria-label="Material"
                            />
                            <NativeSelect
                                name="category"
                                options={categories}
                                aria-label="Categoría"
                            />
                            <Input
                                name="unit"
                                defaultValue="unidad"
                                aria-label="Unidad"
                            />
                            <Input
                                name="quantity"
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="Stock"
                                aria-label="Stock inicial"
                            />
                            <Input
                                name="min_quantity"
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="Mínimo"
                                aria-label="Stock mínimo"
                            />
                            <Button type="submit" disabled={processing}>
                                <Plus /> Agregar
                            </Button>
                            <InputError
                                message={errors.name ?? errors.unit}
                                className="sm:col-span-6"
                            />
                        </>
                    )}
                </Form>

                <div className="overflow-x-auto rounded-2xl border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3 font-medium">Material</th>
                                <th className="p-3 font-medium">Categoría</th>
                                <th className="p-3 text-right font-medium">
                                    Stock
                                </th>
                                <th className="p-3 font-medium" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td className="p-3 font-medium">
                                        {item.name}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {item.category_label}
                                    </td>
                                    <td
                                        className={cn(
                                            'p-3 text-right tabular-nums',
                                            item.low &&
                                                'font-semibold text-amber-700 dark:text-amber-400',
                                        )}
                                    >
                                        {qty.format(item.quantity)} {item.unit}
                                        {item.min_quantity > 0 && (
                                            <span className="block text-xs font-normal text-muted-foreground">
                                                mín.{' '}
                                                {qty.format(item.min_quantity)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setMoving({
                                                        item,
                                                        type: 'entrada',
                                                    })
                                                }
                                            >
                                                <ArrowDownToLine /> Entrada
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setMoving({
                                                        item,
                                                        type: 'salida',
                                                    })
                                                }
                                            >
                                                <ArrowUpFromLine /> Salida
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {items.length === 0 && (
                        <p className="p-8 text-center text-muted-foreground">
                            Agrega los materiales que quieres controlar.
                        </p>
                    )}
                </div>

                {movements.length > 0 && (
                    <section className="space-y-2">
                        <h2 className="font-semibold">Últimos movimientos</h2>
                        <ul className="divide-y rounded-2xl border bg-card text-sm">
                            {movements.map((movement) => (
                                <li
                                    key={movement.id}
                                    className="flex flex-wrap justify-between gap-2 px-4 py-2"
                                >
                                    <span>
                                        <span
                                            className={
                                                movement.type === 'entrada'
                                                    ? 'text-green-700 dark:text-green-400'
                                                    : 'text-orange-700 dark:text-orange-400'
                                            }
                                        >
                                            {movement.type === 'entrada'
                                                ? '+'
                                                : '−'}
                                            {qty.format(movement.quantity)}{' '}
                                            {movement.unit}
                                        </span>{' '}
                                        {movement.item}
                                        {movement.student &&
                                            ` · trajo ${movement.student}`}
                                        {movement.reason &&
                                            ` · ${movement.reason}`}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {movement.user} ·{' '}
                                        {when.format(
                                            new Date(movement.created_at),
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            <Dialog
                open={moving !== null}
                onOpenChange={(open) => !open && setMoving(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {moving?.type === 'entrada'
                                ? 'Entrada de'
                                : 'Salida de'}{' '}
                            {moving?.item.name}
                        </DialogTitle>
                    </DialogHeader>
                    {moving && (
                        <Form
                            {...InventoryController.move.form(moving.item.id)}
                            options={{ preserveScroll: true }}
                            onSuccess={() => setMoving(null)}
                            className="grid gap-3"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <input
                                        type="hidden"
                                        name="type"
                                        value={moving.type}
                                    />
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="mv-qty">
                                            Cantidad ({moving.item.unit})
                                        </Label>
                                        <Input
                                            id="mv-qty"
                                            name="quantity"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                        />
                                        <InputError message={errors.quantity} />
                                    </div>
                                    {moving.type === 'entrada' && (
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="mv-student">
                                                Lo trajo un alumno (útiles)
                                            </Label>
                                            <NativeSelect
                                                id="mv-student"
                                                name="student_id"
                                                placeholder="No, fue una compra"
                                                options={students}
                                            />
                                        </div>
                                    )}
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="mv-reason">
                                            Detalle
                                        </Label>
                                        <Input
                                            id="mv-reason"
                                            name="reason"
                                            placeholder={
                                                moving.type === 'entrada'
                                                    ? 'Compra en librería'
                                                    : 'Para el salón Patitos'
                                            }
                                        />
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        Registrar
                                    </Button>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

Inventory.layout = {
    breadcrumbs: [{ title: 'Inventario', href: index() }],
};
