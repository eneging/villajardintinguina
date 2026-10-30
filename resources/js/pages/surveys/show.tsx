import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Star } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { index, submit } from '@/routes/surveys';
import type { SurveyQuestion } from '@/types';

type Props = {
    survey: {
        id: number;
        title: string;
        description: string | null;
        questions: (SurveyQuestion & { key: string })[];
        anonymous: boolean;
    };
    open: boolean;
    answered: boolean;
};

export default function SurveyShow({ survey, open, answered }: Props) {
    const form = useForm({ answers: {} as Record<string, string | number> });
    const errors = form.errors as Record<string, string | undefined>;
    const setAnswer = (key: string, value: string | number) =>
        form.setData('answers', { ...form.data.answers, [key]: value });

    if (answered || !open) {
        return (
            <>
                <Head title={survey.title} />
                <div className="mx-auto w-full max-w-2xl p-4">
                    <div className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-10 text-center">
                        <CheckCircle2 className="size-12 text-green-600" />
                        <h1 className="text-xl font-semibold">
                            {answered
                                ? '¡Gracias! Ya respondiste esta encuesta.'
                                : 'Esta encuesta ya cerró.'}
                        </h1>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={survey.title} />
            <form
                className="mx-auto w-full max-w-2xl space-y-5 p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.submit(submit(survey.id));
                }}
            >
                <Heading
                    title={survey.title}
                    description={`${survey.description ?? ''}${survey.anonymous ? ' Tus respuestas son anónimas.' : ''}`}
                />
                {survey.questions.map((question, index) => (
                    <section
                        key={question.key}
                        className="space-y-3 rounded-2xl border bg-card p-5"
                    >
                        <p className="font-medium">
                            {index + 1}. {question.label}
                            {!question.required && (
                                <span className="text-sm font-normal text-muted-foreground">
                                    {' '}
                                    (opcional)
                                </span>
                            )}
                        </p>
                        {question.type === 'rating' && (
                            <div
                                className="flex gap-1"
                                role="radiogroup"
                                aria-label={question.label}
                            >
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        role="radio"
                                        aria-checked={
                                            form.data.answers[question.key] ===
                                            n
                                        }
                                        aria-label={`${n} de 5`}
                                        onClick={() =>
                                            setAnswer(question.key, n)
                                        }
                                        className="p-1"
                                    >
                                        <Star
                                            className={cn(
                                                'size-9 transition',
                                                Number(
                                                    form.data.answers[
                                                        question.key
                                                    ] ?? 0,
                                                ) >= n
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-muted-foreground',
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                        {question.type === 'choice' && (
                            <div className="flex flex-wrap gap-2">
                                {question.options.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        aria-pressed={
                                            form.data.answers[question.key] ===
                                            option
                                        }
                                        onClick={() =>
                                            setAnswer(question.key, option)
                                        }
                                        className={cn(
                                            'rounded-full border px-4 py-1.5 text-sm font-medium',
                                            form.data.answers[question.key] ===
                                                option
                                                ? 'border-green-600 bg-green-600 text-white'
                                                : 'hover:bg-accent',
                                        )}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                        {question.type === 'text' && (
                            <textarea
                                aria-label={question.label}
                                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                value={String(
                                    form.data.answers[question.key] ?? '',
                                )}
                                onChange={(e) =>
                                    setAnswer(question.key, e.target.value)
                                }
                            />
                        )}
                        <InputError
                            message={errors[`answers.${question.key}`]}
                        />
                    </section>
                ))}
                <Button type="submit" size="lg" disabled={form.processing}>
                    Enviar respuestas
                </Button>
            </form>
        </>
    );
}

SurveyShow.layout = { breadcrumbs: [{ title: 'Encuestas', href: index() }] };
