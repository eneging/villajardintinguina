import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import SurveyController from '@/actions/App/Http/Controllers/Admin/SurveyController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/surveys';
import type { Option, SurveyQuestion } from '@/types';

type Props = {
    survey: {
        id: number;
        title: string;
        description: string | null;
        audience: string;
        questions: SurveyQuestion[];
        anonymous: boolean;
        published: boolean;
        closes_on: string | null;
        locked: boolean;
    } | null;
    audiences: Option[];
};

const defaults: SurveyQuestion[] = [
    {
        label: '¿Qué tan satisfecho(a) estás con el colegio?',
        type: 'rating',
        required: true,
        options: [],
    },
    {
        label: '¿Cómo calificas la comunicación con la maestra?',
        type: 'rating',
        required: true,
        options: [],
    },
    {
        label: '¿Nos recomendarías a otras familias?',
        type: 'choice',
        required: true,
        options: ['Sí', 'Tal vez', 'No'],
    },
    {
        label: '¿Qué podemos mejorar?',
        type: 'text',
        required: false,
        options: [],
    },
];

const typeOptions = [
    { value: 'rating', label: 'Puntaje de 1 a 5' },
    { value: 'choice', label: 'Elegir una opción' },
    { value: 'text', label: 'Respuesta libre' },
];

export default function SurveyForm({ survey, audiences }: Props) {
    const form = useForm({
        title: survey?.title ?? 'Encuesta de satisfacción',
        description: survey?.description ?? '',
        audience: survey?.audience ?? 'parents',
        anonymous: survey?.anonymous ?? true,
        published: survey?.published ?? false,
        closes_on: survey?.closes_on ?? '',
        questions: survey?.questions ?? defaults,
    });
    const { data, setData, processing } = form;
    const errors = form.errors as Record<string, string | undefined>;
    const locked = survey?.locked ?? false;
    const setQuestion = (index: number, patch: Partial<SurveyQuestion>) =>
        setData(
            'questions',
            data.questions.map((q, i) =>
                i === index ? { ...q, ...patch } : q,
            ),
        );

    return (
        <>
            <Head title={survey ? 'Editar encuesta' : 'Nueva encuesta'} />
            <form
                className="mx-auto w-full max-w-3xl space-y-5 p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((values) => ({
                        ...values,
                        closes_on: values.closes_on || null,
                    }));
                    form.submit(
                        survey
                            ? SurveyController.update(survey.id)
                            : SurveyController.store(),
                    );
                }}
            >
                <Heading
                    title={survey ? 'Editar encuesta' : 'Nueva encuesta'}
                />
                <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
                    <div className="grid gap-1.5 sm:col-span-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        <InputError message={errors.title} />
                    </div>
                    <div className="grid gap-1.5 sm:col-span-2">
                        <Label htmlFor="description">Presentación</Label>
                        <Input
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Tu opinión nos ayuda a mejorar."
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="audience">Para</Label>
                        <NativeSelect
                            id="audience"
                            value={data.audience}
                            options={audiences}
                            onChange={(e) =>
                                setData('audience', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="closes_on">Cierra el (opcional)</Label>
                        <Input
                            id="closes_on"
                            type="date"
                            value={data.closes_on}
                            onChange={(e) =>
                                setData('closes_on', e.target.value)
                            }
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={data.anonymous}
                            onCheckedChange={(c) =>
                                setData('anonymous', c === true)
                            }
                        />{' '}
                        Respuestas anónimas
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={data.published}
                            onCheckedChange={(c) =>
                                setData('published', c === true)
                            }
                        />{' '}
                        Publicar y avisar
                    </label>
                </section>

                <section className="space-y-3 rounded-2xl border bg-card p-5">
                    <h2 className="font-semibold">Preguntas</h2>
                    {locked && (
                        <p className="text-sm text-amber-700">
                            Ya hay respuestas: las preguntas no se pueden
                            cambiar.
                        </p>
                    )}
                    {data.questions.map((question, index) => (
                        <div
                            key={index}
                            className="space-y-2 rounded-xl border p-3"
                        >
                            <div className="flex gap-2">
                                <Input
                                    aria-label="Pregunta"
                                    value={question.label}
                                    disabled={locked}
                                    onChange={(e) =>
                                        setQuestion(index, {
                                            label: e.target.value,
                                        })
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Quitar pregunta"
                                    disabled={locked}
                                    onClick={() =>
                                        setData(
                                            'questions',
                                            data.questions.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <NativeSelect
                                    className="w-52"
                                    aria-label="Tipo"
                                    value={question.type}
                                    disabled={locked}
                                    options={typeOptions}
                                    onChange={(e) =>
                                        setQuestion(index, {
                                            type: e.target
                                                .value as SurveyQuestion['type'],
                                        })
                                    }
                                />
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={question.required}
                                        disabled={locked}
                                        onCheckedChange={(c) =>
                                            setQuestion(index, {
                                                required: c === true,
                                            })
                                        }
                                    />{' '}
                                    Obligatoria
                                </label>
                            </div>
                            {question.type === 'choice' && (
                                <Input
                                    aria-label="Opciones separadas por coma"
                                    placeholder="Sí, Tal vez, No"
                                    disabled={locked}
                                    value={question.options.join(', ')}
                                    onChange={(e) =>
                                        setQuestion(index, {
                                            options: e.target.value
                                                .split(',')
                                                .map((o) => o.trim()),
                                        })
                                    }
                                />
                            )}
                            <InputError
                                message={
                                    errors[`questions.${index}.label`] ??
                                    errors[`questions.${index}.options`]
                                }
                            />
                        </div>
                    ))}
                    {!locked && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setData('questions', [
                                    ...data.questions,
                                    {
                                        label: '',
                                        type: 'rating',
                                        required: true,
                                        options: [],
                                    },
                                ])
                            }
                        >
                            <Plus /> Agregar pregunta
                        </Button>
                    )}
                    <InputError message={errors.questions} />
                </section>

                <div className="flex flex-wrap justify-between gap-2">
                    {survey ? (
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() =>
                                confirm(
                                    '¿Eliminar la encuesta y sus respuestas?',
                                ) &&
                                router.delete(
                                    SurveyController.destroy.url(survey.id),
                                )
                            }
                        >
                            <Trash2 /> Eliminar
                        </Button>
                    ) : (
                        <span />
                    )}
                    <div className="flex gap-2">
                        <Button variant="ghost" asChild>
                            <Link href={index()}>Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Guardar
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
}

SurveyForm.layout = { breadcrumbs: [{ title: 'Encuestas', href: index() }] };
