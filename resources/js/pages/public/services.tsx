import { Head, Link, usePage } from '@inertiajs/react';
import { Clock, MessageCircle, Quote } from 'lucide-react';
import {
    PageHero,
    PublicLayout,
    whatsappLink,
} from '@/components/school/public-layout';
import { SiteIcon } from '@/components/school/site-icon';
import { admission } from '@/routes';
import type {
    SiteIconItem,
    SiteLevel,
    SiteScheduleItem,
    SiteTestimonial,
} from '@/types';

type Props = {
    content: {
        services: { items: SiteIconItem[] };
        levels: { items: SiteLevel[] };
        schedule: { items: SiteScheduleItem[] };
        testimonials: { items: SiteTestimonial[] };
    };
};

const tints = [
    'bg-amber-100 text-amber-700',
    'bg-sky-100 text-sky-700',
    'bg-green-100 text-green-700',
    'bg-pink-100 text-pink-700',
    'bg-violet-100 text-violet-700',
    'bg-orange-100 text-orange-700',
];

export default function Services({ content }: Props) {
    const { school } = usePage().props;
    const { services, levels, schedule, testimonials } = content;

    return (
        <PublicLayout width="full">
            <Head title="Servicios" />
            <PageHero
                title="Servicios y diferenciadores"
                subtitle="Todo lo que tu niño vive en Villa Jardín, pensado para que crezca feliz y seguro."
                emoji="🎈"
            />

            <section className="mx-auto max-w-6xl px-4 pb-16">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {services.items.map((item, index) => (
                        <article
                            key={item.title}
                            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                        >
                            <div
                                className={`mb-4 flex size-14 items-center justify-center rounded-2xl ${tints[index % tints.length]}`}
                            >
                                <SiteIcon name={item.icon} className="size-7" />
                            </div>
                            <h2 className="mb-1 font-display text-xl font-bold">
                                {item.title}
                            </h2>
                            <p className="text-slate-600">{item.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="bg-white py-16">
                <div className="mx-auto max-w-6xl space-y-10 px-4">
                    <h2 className="text-center font-display text-3xl font-bold text-slate-900">
                        Niveles
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {levels.items.map((level) => (
                            <article
                                key={level.name}
                                className="rounded-3xl p-6 text-white shadow-sm"
                                style={{ backgroundColor: level.color }}
                            >
                                <div className="mb-3 text-5xl" aria-hidden>
                                    {level.mascot}
                                </div>
                                <h3 className="font-display text-xl font-bold">
                                    {level.name}
                                </h3>
                                <p className="mb-2 text-sm font-medium opacity-90">
                                    {level.age}
                                </p>
                                <p className="text-sm opacity-95">
                                    {level.text}
                                </p>
                            </article>
                        ))}
                    </div>
                    {schedule.items.length > 0 && (
                        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
                            {schedule.items.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex gap-3 rounded-2xl bg-[#fffaf0] p-4"
                                >
                                    <Clock className="mt-0.5 size-5 shrink-0 text-green-600" />
                                    <div>
                                        <p className="font-semibold">
                                            {item.label}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {item.hours}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {testimonials.items.length > 0 && (
                <section className="py-16">
                    <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
                        {testimonials.items.map((testimonial) => (
                            <figure
                                key={testimonial.name + testimonial.text}
                                className="rounded-3xl bg-white p-6 shadow-sm"
                            >
                                <Quote className="mb-2 size-6 text-amber-400" />
                                <blockquote className="text-slate-700">
                                    {testimonial.text}
                                </blockquote>
                                <figcaption className="mt-3 text-sm font-semibold">
                                    {testimonial.name}
                                    {testimonial.relation && (
                                        <span className="font-normal text-slate-500">
                                            {' '}
                                            · {testimonial.relation}
                                        </span>
                                    )}
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
            )}

            <section className="pb-20">
                <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 rounded-[2rem] bg-amber-100 px-6 py-10 text-center">
                    <h2 className="font-display text-3xl font-bold text-slate-900">
                        Ven a conocernos
                    </h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        <a
                            href={whatsappLink(
                                school.whatsapp,
                                'Hola, quisiera agendar una visita a Villa Jardín.',
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-semibold text-white shadow-md hover:brightness-95"
                        >
                            <MessageCircle className="size-5" /> Agendar visita
                        </a>
                        <Link
                            href={admission()}
                            className="inline-flex items-center rounded-full border-2 border-slate-800 px-6 py-3 font-semibold transition hover:bg-slate-800 hover:text-white"
                        >
                            Solicitar vacante
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
