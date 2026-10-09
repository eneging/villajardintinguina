import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Camera,
    HeartHandshake,
    MessageCircle,
    Music,
    ShieldCheck,
    Soup,
    Sparkles,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login } from '@/routes';

// Textos provisionales: se reemplazarán por contenido editable desde la intranet.
const levels = [
    {
        name: 'Guardería / Cuna',
        age: 'Desde los 6 meses',
        mascot: '🐣',
        color: '#f59e0b',
        text: 'Cuidado amoroso, estimulación temprana y rutinas de sueño y alimentación.',
    },
    {
        name: 'Inicial 3 años',
        age: 'Salón Patitos',
        mascot: '🐥',
        color: '#0ea5e9',
        text: 'Autonomía, lenguaje y juego libre para descubrir el mundo.',
    },
    {
        name: 'Inicial 4 años',
        age: 'Salón Ositos',
        mascot: '🐻',
        color: '#22c55e',
        text: 'Proyectos, arte y psicomotricidad para crecer con confianza.',
    },
    {
        name: 'Inicial 5 años',
        age: 'Salón Leoncitos',
        mascot: '🦁',
        color: '#ef4444',
        text: 'Preparación para primaria: pre-escritura, lógica y valores.',
    },
];

const features = [
    {
        icon: HeartHandshake,
        title: 'Maestras con vocación',
        text: 'Docentes tituladas que acompañan a cada niño con cariño y paciencia.',
    },
    {
        icon: BookOpen,
        title: 'Papás informados',
        text: 'Cada semana publicamos en la plataforma lo que aprenderán sus hijos.',
    },
    {
        icon: Music,
        title: 'Talleres',
        text: 'Música, inglés, arte y psicomotricidad como parte de la jornada.',
    },
    {
        icon: Soup,
        title: 'Alimentación',
        text: 'Loncheras y menús balanceados pensados para su edad.',
    },
    {
        icon: ShieldCheck,
        title: 'Ambiente seguro',
        text: 'Protocolo de recojo con personas autorizadas y espacios adaptados.',
    },
    {
        icon: Camera,
        title: 'Momentos compartidos',
        text: 'Fotos y videos de las actividades en la galería privada de cada salón.',
    },
];

export default function Welcome() {
    const { auth, school } = usePage().props;
    const whatsapp = `https://wa.me/${school.whatsapp}?text=${encodeURIComponent('¡Hola! Quisiera información sobre la matrícula en EP Villa Jardín.')}`;

    return (
        <>
            <Head title="Educación inicial y guardería en Ica" />

            <div className="min-h-screen bg-[#fffaf0] text-slate-800">
                <header className="sticky top-0 z-20 border-b border-amber-100 bg-[#fffaf0]/90 backdrop-blur">
                    <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
                        <a href="#inicio" className="flex items-center gap-2">
                            <AppLogoIcon className="size-9 fill-green-600" />
                            <span className="font-display text-xl leading-none font-bold text-green-700">
                                Villa Jardín
                            </span>
                        </a>
                        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
                            <a href="#niveles" className="hover:text-green-700">
                                Niveles
                            </a>
                            <a href="#por-que" className="hover:text-green-700">
                                ¿Por qué elegirnos?
                            </a>
                            <a
                                href="#conocenos"
                                className="hover:text-green-700"
                            >
                                Conócenos
                            </a>
                            <a
                                href="#contacto"
                                className="hover:text-green-700"
                            >
                                Contacto
                            </a>
                        </div>
                        <Link
                            href={auth.user ? dashboard() : login()}
                            className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                        >
                            {auth.user ? 'Mi plataforma' : 'Ingresar'}
                        </Link>
                    </nav>
                </header>

                <main>
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
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-medium text-green-700 shadow-sm">
                                    <Sparkles className="size-4" /> Matrículas
                                    abiertas
                                </span>
                                <h1 className="font-display text-4xl leading-[1.05] font-extrabold text-slate-900 sm:text-5xl lg:text-6xl">
                                    Donde los niños{' '}
                                    <span className="text-green-600">
                                        florecen
                                    </span>{' '}
                                    jugando y aprendiendo
                                </h1>
                                <p className="max-w-lg text-lg text-slate-600">
                                    Colegio de educación inicial y guardería en
                                    Ica. Un segundo hogar lleno de color, cariño
                                    y aprendizaje para tus hijos de 0 a 5 años.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <a
                                        href={whatsapp}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-semibold text-white shadow-md transition hover:brightness-95"
                                    >
                                        <MessageCircle className="size-5" />{' '}
                                        Agenda tu visita
                                    </a>
                                    <a
                                        href="#niveles"
                                        className="inline-flex items-center rounded-full border-2 border-slate-800 px-6 py-3 font-semibold transition hover:bg-slate-800 hover:text-white"
                                    >
                                        Ver niveles
                                    </a>
                                </div>
                            </div>
                            <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4">
                                {levels.map((level, index) => (
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
                                        <span className="mt-2 font-display text-lg font-bold text-white">
                                            {level.age}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="niveles" className="bg-white py-20">
                        <div className="mx-auto max-w-6xl space-y-10 px-4">
                            <div className="mx-auto max-w-2xl space-y-3 text-center">
                                <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                                    Nuestros niveles
                                </h2>
                                <p className="text-slate-600">
                                    Cada salón tiene su mascota, su color y una
                                    maestra que conoce a cada niño por su
                                    nombre.
                                </p>
                            </div>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {levels.map((level) => (
                                    <article
                                        key={level.name}
                                        className="rounded-3xl border-b-8 bg-[#fffaf0] p-6 shadow-sm"
                                        style={{ borderColor: level.color }}
                                    >
                                        <div
                                            className="mb-4 text-5xl"
                                            aria-hidden
                                        >
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
                                {features.map(({ icon: Icon, title, text }) => (
                                    <div
                                        key={title}
                                        className="flex gap-4 rounded-3xl bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                                            <Icon className="size-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">
                                                {title}
                                            </h3>
                                            <p className="text-sm text-slate-600">
                                                {text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        id="conocenos"
                        className="bg-green-600 py-20 text-white"
                    >
                        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
                            <div className="space-y-4">
                                <h2 className="font-display text-3xl font-bold sm:text-4xl">
                                    Conócenos en video
                                </h2>
                                <p className="text-green-50">
                                    Recorre nuestras aulas, conoce a las
                                    maestras y descubre cómo es un día en Villa
                                    Jardín. Las familias matriculadas reciben
                                    además una inducción completa en la
                                    plataforma.
                                </p>
                            </div>
                            {/* Video de presentación: se configurará desde la intranet (Cloudinary). */}
                            <div className="flex aspect-video items-center justify-center rounded-3xl bg-green-700/60 text-center text-green-100 ring-4 ring-white/30">
                                <span className="px-6">
                                    🎬 Aquí irá el video de presentación del
                                    colegio
                                </span>
                            </div>
                        </div>
                    </section>

                    <section id="contacto" className="py-20">
                        <div className="mx-auto max-w-3xl space-y-6 px-4 text-center">
                            <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                                ¿Listos para ser parte de la familia?
                            </h2>
                            <p className="text-slate-600">
                                Escríbenos y agenda una visita para conocer el
                                colegio.
                            </p>
                            <a
                                href={whatsapp}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:brightness-95"
                            >
                                <MessageCircle className="size-6" /> Escríbenos
                                por WhatsApp
                            </a>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-amber-100 bg-white">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row">
                        <p>
                            © {new Date().getFullYear()} EP Villa Jardín · Ica,
                            Perú
                        </p>
                        {/* El Libro de Reclamaciones virtual se implementa en la siguiente fase. */}
                        <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                            📕 Libro de Reclamaciones
                        </span>
                    </div>
                </footer>
            </div>
        </>
    );
}
