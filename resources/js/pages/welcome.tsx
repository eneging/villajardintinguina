import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Clock,
    MessageCircle,
    PlayCircle,
    Quote,
    Sparkles,
} from 'lucide-react';
import { AlbumCard } from '@/components/gallery/album-card';
import { PublicLayout, whatsappLink } from '@/components/school/public-layout';
import { SiteIcon } from '@/components/school/site-icon';
import { mapEmbedUrl, youtubeEmbedUrl } from '@/lib/school';
import { about, admission, photos, services, videos } from '@/routes';
import { show as photoAlbum } from '@/routes/photos';
import { show as videoShow } from '@/routes/videos';
import type {
    AlbumCard as Album,
    PublicLessonCard,
    SiteHero,
    SiteIconItem,
    SiteLevel,
    SiteScheduleItem,
    SiteTestimonial,
} from '@/types';

type Props = {
    content: {
        hero: SiteHero;
        levels: { items: SiteLevel[] };
        services: { items: SiteIconItem[] };
        testimonials: { items: SiteTestimonial[] };
        schedule: { items: SiteScheduleItem[] };
        admission: { open: boolean };
    };
    videos: PublicLessonCard[];
    albums: Album[];
};

export default function Welcome({ content, videos: lessons, albums }: Props) {
    const { school, contact } = usePage().props;
    const { hero, levels, testimonials, schedule } = content;
    const whatsapp = whatsappLink(
        school.whatsapp,
        '¡Hola! Quisiera información sobre la matrícula en EP Villa Jardín.',
    );
    const youtube = hero.video_url ? youtubeEmbedUrl(hero.video_url) : null;

    return (
        <PublicLayout width="full">
            <Head title="Educación inicial y guardería en Ica" />

            <section id="inicio" className="relative overflow-hidden">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-amber-200/60 blur-3xl"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-40 -right-20 size-72 rounded-full bg-sky-200/60 blur-3xl"
                />
                <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
                    <div className="space-y-6">
                        {hero.badge && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-medium text-green-700 shadow-sm">
                                <Sparkles className="size-4" /> {hero.badge}
                            </span>
                        )}
                        <h1 className="font-display text-4xl leading-[1.05] font-extrabold text-slate-900 sm:text-5xl lg:text-6xl">
                            {hero.title}{' '}
                            {hero.highlight && (
                                <span className="text-green-600">
                                    {hero.highlight}
                                </span>
                            )}{' '}
                            {hero.title_end}
                        </h1>
                        {hero.subtitle && (
                            <p className="max-w-lg text-lg text-slate-600">
                                {hero.subtitle}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={whatsapp}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-semibold text-white shadow-md transition hover:brightness-95"
                            >
                                <MessageCircle className="size-5" /> Agenda tu
                                visita
                            </a>
                            {content.admission.open && (
                                <Link
                                    href={admission()}
                                    className="inline-flex items-center rounded-full border-2 border-slate-800 px-6 py-3 font-semibold transition hover:bg-slate-800 hover:text-white"
                                >
                                    Solicitar vacante
                                </Link>
                            )}
                        </div>
                    </div>
                    {hero.video ? (
                        <video
                            src={hero.video.url}
                            poster={hero.video.thumbnail ?? undefined}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl ring-8 ring-white"
                        />
                    ) : hero.image ? (
                        <img
                            src={hero.image.url}
                            alt=""
                            className="aspect-[4/3] w-full rotate-1 rounded-[2rem] object-cover shadow-xl ring-8 ring-white"
                        />
                    ) : (
                        <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4">
                            {levels.items.slice(0, 4).map((level, index) => (
                                <div
                                    key={level.name}
                                    className="flex aspect-square flex-col items-center justify-center rounded-[2rem] text-center shadow-lg transition hover:-translate-y-1"
                                    style={{
                                        backgroundColor: level.color,
                                        transform: `rotate(${index % 2 === 0 ? -3 : 3}deg)`,
                                    }}
                                >
                                    <span className="text-6xl" aria-hidden>
                                        {level.mascot}
                                    </span>
                                    <span className="mt-2 px-2 font-display text-lg font-bold text-white">
                                        {level.age}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section id="niveles" className="bg-white py-20">
                <div className="mx-auto max-w-6xl space-y-10 px-4">
                    <div className="mx-auto max-w-2xl space-y-3 text-center">
                        <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                            Nuestros niveles
                        </h2>
                        <p className="text-slate-600">
                            Cada salón tiene su mascota, su color y una maestra
                            que conoce a cada niño por su nombre.
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {levels.items.map((level) => (
                            <article
                                key={level.name}
                                className="rounded-3xl border-b-8 bg-[#fffaf0] p-6 shadow-sm transition hover:-translate-y-1"
                                style={{ borderColor: level.color }}
                            >
                                <div className="mb-4 text-5xl" aria-hidden>
                                    {level.mascot}
                                </div>
                                <h3 className="font-display text-xl font-bold">
                                    {level.name}
                                </h3>
                                <p
                                    className="mb-2 text-sm font-medium"
                                    style={{ color: level.color }}
                                >
                                    {level.age}
                                </p>
                                <p className="text-sm text-slate-600">
                                    {level.text}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="por-que" className="py-20">
                <div className="mx-auto max-w-6xl space-y-10 px-4">
                    <h2 className="text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                        ¿Por qué Villa Jardín?
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {content.services.items.slice(0, 6).map((item) => (
                            <div
                                key={item.title}
                                className="flex gap-4 rounded-3xl bg-white p-6 shadow-sm"
                            >
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                                    <SiteIcon
                                        name={item.icon}
                                        className="size-6"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        {item.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Link
                            href={services()}
                            className="inline-flex items-center gap-1 font-semibold text-green-700 hover:underline"
                        >
                            Ver todos los servicios{' '}
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <section id="conocenos" className="bg-green-600 py-20 text-white">
                <div className="mx-auto max-w-6xl space-y-10 px-4">
                    <div className="grid items-center gap-10 md:grid-cols-2">
                        <div className="space-y-4">
                            <h2 className="font-display text-3xl font-bold sm:text-4xl">
                                Conócenos en video
                            </h2>
                            <p className="text-green-50">
                                Recorre nuestras aulas, conoce a las maestras y
                                descubre cómo es un día en Villa Jardín. Las
                                familias matriculadas reciben además una
                                inducción completa en la plataforma.
                            </p>
                            <Link
                                href={about()}
                                className="inline-flex items-center gap-1 rounded-full bg-white px-5 py-2 font-semibold text-green-700 transition hover:bg-green-50"
                            >
                                Nuestra historia{' '}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        {youtube ? (
                            <iframe
                                src={youtube}
                                title="Video de presentación"
                                className="aspect-video w-full rounded-3xl ring-4 ring-white/30"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : lessons[0] ? (
                            <Link
                                href={videoShow(lessons[0].id)}
                                className="group relative block aspect-video overflow-hidden rounded-3xl bg-green-700/60 ring-4 ring-white/30"
                            >
                                {lessons[0].cover?.thumbnail && (
                                    <img
                                        src={lessons[0].cover.thumbnail}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                )}
                                <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                                    <PlayCircle className="size-16" />
                                </span>
                            </Link>
                        ) : (
                            <div className="flex aspect-video items-center justify-center rounded-3xl bg-green-700/60 text-center text-green-100 ring-4 ring-white/30">
                                <span className="px-6">
                                    🎬 Muy pronto: el video de presentación del
                                    colegio
                                </span>
                            </div>
                        )}
                    </div>
                    {lessons.length > 0 && (
                        <div className="grid gap-4 sm:grid-cols-3">
                            {lessons.map((lesson) => (
                                <Link
                                    key={lesson.id}
                                    href={videoShow(lesson.id)}
                                    className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 transition hover:bg-white/20"
                                >
                                    <PlayCircle className="size-8 shrink-0" />
                                    <span className="font-medium">
                                        {lesson.title}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                    {lessons.length > 0 && (
                        <div className="text-center">
                            <Link
                                href={videos()}
                                className="font-semibold underline-offset-4 hover:underline"
                            >
                                Ver todos los videos →
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {albums.length > 0 && (
                <section id="fotos" className="py-20">
                    <div className="mx-auto max-w-6xl space-y-10 px-4">
                        <h2 className="text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                            Momentos en Villa Jardín
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {albums.map((album) => (
                                <AlbumCard
                                    key={album.id}
                                    album={album}
                                    href={photoAlbum(album.id).url}
                                />
                            ))}
                        </div>
                        <div className="text-center">
                            <Link
                                href={photos()}
                                className="inline-flex items-center gap-1 font-semibold text-green-700 hover:underline"
                            >
                                Ver galería <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {testimonials.items.length > 0 && (
                <section id="testimonios" className="bg-amber-50 py-20">
                    <div className="mx-auto max-w-6xl space-y-10 px-4">
                        <h2 className="text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                            Lo que dicen las familias
                        </h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            {testimonials.items.map((testimonial) => (
                                <figure
                                    key={testimonial.name + testimonial.text}
                                    className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm"
                                >
                                    <blockquote className="space-y-2">
                                        <Quote className="size-6 text-amber-400" />
                                        <p className="text-slate-700">
                                            {testimonial.text}
                                        </p>
                                    </blockquote>
                                    <figcaption className="text-sm">
                                        <span className="font-semibold">
                                            {testimonial.name}
                                        </span>
                                        {testimonial.relation && (
                                            <span className="text-slate-500">
                                                {' '}
                                                · {testimonial.relation}
                                            </span>
                                        )}
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section id="contacto" className="py-20">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
                    <div className="space-y-6">
                        <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                            ¿Listos para ser parte de la familia?
                        </h2>
                        <p className="text-slate-600">
                            Escríbenos y agenda una visita para conocer el
                            colegio.
                        </p>
                        {schedule.items.length > 0 && (
                            <ul className="space-y-2">
                                {schedule.items.map((item) => (
                                    <li
                                        key={item.label}
                                        className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm"
                                    >
                                        <Clock className="mt-0.5 size-5 shrink-0 text-green-600" />
                                        <span>
                                            <span className="font-semibold">
                                                {item.label}
                                            </span>
                                            <br />
                                            <span className="text-sm text-slate-600">
                                                {item.hours}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={whatsapp}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-semibold text-white shadow-md transition hover:brightness-95"
                            >
                                <MessageCircle className="size-5" /> Escríbenos
                                por WhatsApp
                            </a>
                            {content.admission.open && (
                                <Link
                                    href={admission()}
                                    className="inline-flex items-center rounded-full border-2 border-slate-800 px-6 py-3 font-semibold transition hover:bg-slate-800 hover:text-white"
                                >
                                    Formulario de admisión
                                </Link>
                            )}
                        </div>
                    </div>
                    {contact.map_query && (
                        <iframe
                            title="Ubicación de Villa Jardín"
                            src={mapEmbedUrl(contact.map_query)}
                            className="min-h-80 w-full rounded-3xl border-0 shadow-sm"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
