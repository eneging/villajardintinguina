import { Form, Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import IncidentController from '@/actions/App/Http/Controllers/IncidentController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { IncidentList } from '@/components/school/incident-list';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/incidents';
import type { IncidentItem, Option } from '@/types';

type Props = {
    incidents: IncidentItem[];
    students: { value: number; label: string }[];
    types: Option[];
};

const textareaClass =
    'min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

function nowLocal(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());

    return d.toISOString().slice(0, 16);
}

export default function Incidents({ incidents, students, types }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Head title="Incidentes y enfermería" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Incidentes y enfermería"
                        description="Golpes, fiebre, medicinas o conducta. La familia recibe el aviso y confirma que lo leyó."
                    />
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus /> Registrar incidente
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Registrar incidente</DialogTitle>
                            </DialogHeader>
                            <Form
                                {...IncidentController.store.form()}
                                options={{ preserveScroll: true }}
                                onSuccess={() => setOpen(false)}
                                resetOnSuccess
                                className="grid gap-3"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="inc-student">
                                                Alumno
                                            </Label>
                                            <NativeSelect
                                                id="inc-student"
                                                name="student_id"
                                                placeholder="Elegir"
                                                options={students}
                                            />
                                            <InputError
                                                message={errors.student_id}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="inc-type">
                                                    Tipo
                                                </Label>
                                                <NativeSelect
                                                    id="inc-type"
                                                    name="type"
                                                    options={types}
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="inc-at">
                                                    Fecha y hora
                                                </Label>
                                                <Input
                                                    id="inc-at"
                                                    name="occurred_at"
                                                    type="datetime-local"
                                                    defaultValue={nowLocal()}
                                                />
                                                <InputError
                                                    message={errors.occurred_at}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="inc-description">
                                                ¿Qué pasó?
                                            </Label>
                                            <textarea
                                                id="inc-description"
                                                name="description"
                                                className={textareaClass}
                                            />
                                            <InputError
                                                message={errors.description}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="inc-action">
                                                ¿Qué se hizo?
                                            </Label>
                                            <textarea
                                                id="inc-action"
                                                name="action_taken"
                                                className={textareaClass}
                                                placeholder="Se le puso hielo y se avisó por teléfono a la mamá."
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="inc-medicine">
                                                Medicina y dosis (si se dio)
                                            </Label>
                                            <Input
                                                id="inc-medicine"
                                                name="medicine"
                                                placeholder="Paracetamol 5 ml, autorizado por la mamá"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Registrar y avisar a la familia
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
                <IncidentList incidents={incidents} showStudent />
            </div>
        </>
    );
}

Incidents.layout = {
    breadcrumbs: [{ title: 'Incidentes y enfermería', href: index() }],
};
