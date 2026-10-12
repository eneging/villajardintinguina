import { Link, usePage } from '@inertiajs/react';
import {
    Clock,
    Facebook,
    Instagram,
    Mail,
    MapPin,
    Menu,
    MessageCircle,
    Phone,
    X,
    Youtube,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import {
    about,
    admission,
    dashboard,
    home,
    login,
    photos,
    services,
    videos,
} from '@/routes';
import { create as complaintsCreate } from '@/routes/complaints';

const navItems = [
    { title: 'Inicio', href: home() },
    { title: 'Nosotros', href: about() },
    { title: 'Servicios', href: services() },
    { title: 'Videos', href: videos() },
    { title: 'Fotos', href: photos() },
    { title: 'Admisión', href: admission() },
];

const widths = {
    narrow: 'max-w-4xl px-4 py-10',
    wide: 'max-w-6xl px-4 py-12',
    full: '',
};

/** Enlace de WhatsApp con mensaje prellenado. */
export function whatsappLink(number: string, text: string): string {
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** TikTok no está en lucide: ícono simple de nota musical. */
function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.77a5.68 5.68 0 0 0-.77-.05 5.68 5.68 0 1 0 5.68 5.68V9.01a7.33 7.33 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48Z" />
        </svg>
    );
}

/**
 * Marco del sitio público: menú, pie con datos de contacto, redes sociales
 * y el enlace obligatorio al Libro de Reclamaciones.
 */
export function PublicLayout({
    children,
    width = 'narrow',
}: {
    children: ReactNode;
    width?: keyof typeof widths;
}) {
    const { auth, school, contact } = usePage().props;
    const { isCurrentUrl } = useCurrentUrl();
    const [open, setOpen] = useState(false);
    const whatsapp = whatsappLink(
        school.whatsapp,
        '¡Hola! Quisiera información sobre la matrícula en EP Villa Jardín.',
    );
    const socials = [
        { href: contact.facebook, label: 'Facebook', icon: Facebook },
        { href: contact.instagram, label: 'Instagram', icon: Instagram },
        { href: contact.tiktok, label: 'TikTok', icon: TikTokIcon },
        { href: contact.youtube, label: 'YouTube', icon: Youtube },
    ].filter((social) => social.href);

    return (
        <div className="min-h-screen bg-[#fffaf0] text-slate-800 print:bg-white">
            <header className="sticky top-0 z-30 border-b border-amber-100 bg-[#fffaf0]/90 backdrop-blur print:hidden">
                <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
                    <Link href={home()} className="flex items-center gap-2">
                        <AppLogoIcon className="size-9 fill-green-600" />
                        <span className="font-display text-xl leading-none font-bold text-green-700">
                            Villa Jardín
                        </span>
                    </Link>
                    <div className="hidden items-center gap-5 text-sm font-medium lg:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={cn(
                                    'transition hover:text-green-700',
                                    isCurrentUrl(item.href) &&
                                        'text-green-700 underline decoration-2 underline-offset-8',
                                )}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={auth.user ? dashboard() : login()}
                            className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                        >
                            {auth.user ? 'Mi plataforma' : 'Ingresar'}
                        </Link>
                        <button
                            type="button"
                            className="rounded-full p-2 hover:bg-amber-100 lg:hidden"
                            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                            aria-expanded={open}
                            onClick={() => setOpen(!open)}
                        >
                            {open ? (
                                <X className="size-6" />
                            ) : (
                                <Menu className="size-6" />
                            )}
                        </button>
                    </div>
                </nav>
                {open && (
                    <div className="border-t border-amber-100 px-4 pb-4 lg:hidden">
                        <div className="mx-auto grid max-w-6xl gap-1 pt-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className={cn(
                                        'rounded-xl px-3 py-2 font-medium hover:bg-amber-100',
                                        isCurrentUrl(item.href) &&
                                            'bg-green-100 text-green-800',
                                    )}
                                >
                                    {item.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <main className={cn('mx-auto print:p-0', widths[width])}>
                {children}
            </main>

            <footer className="border-t border-amber-100 bg-white print:hidden">
                <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <AppLogoIcon className="size-8 fill-green-600" />
                            <span className="font-display text-lg font-bold text-green-700">
                                Villa Jardín
                            </span>
                        </div>
                        <p className="text-slate-500">
                            Educación inicial y guardería en Ica, Perú.
                        </p>
                        {socials.length > 0 && (
                            <div className="flex gap-2">
                                {socials.map(({ href, label, icon: Icon }) => (
                                    <a
                                        key={label}
                                        href={href!}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={label}
                                        className="flex size-9 items-center justify-center rounded-full bg-green-50 text-green-700 transition hover:bg-green-600 hover:text-white"
                                    >
                                        <Icon className="size-4" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h2 className="font-semibold text-slate-900">
                            Contacto
                        </h2>
                        {contact.address && (
                            <p className="flex gap-2 text-slate-600">
                                <MapPin className="mt-0.5 size-4 shrink-0" />
                                {contact.address}
                            </p>
                        )}
                        {contact.phone && (
                            <a
                                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                                className="flex gap-2 text-slate-600 hover:text-green-700"
                            >
                                <Phone className="mt-0.5 size-4 shrink-0" />
                                {contact.phone}
                            </a>
                        )}
                        {contact.email && (
                            <a
                                href={`mailto:${contact.email}`}
                                className="flex gap-2 text-slate-600 hover:text-green-700"
                            >
                                <Mail className="mt-0.5 size-4 shrink-0" />
                                {contact.email}
                            </a>
                        )}
                        {contact.hours && (
                            <p className="flex gap-2 text-slate-600">
                                <Clock className="mt-0.5 size-4 shrink-0" />
                                {contact.hours}
                            </p>
                        )}
                        <a
                            href={whatsapp}
                            target="_blank"
                            rel="noreferrer"
                            className="flex gap-2 font-medium text-green-700 hover:underline"
                        >
                            <MessageCircle className="mt-0.5 size-4 shrink-0" />
                            Escríbenos por WhatsApp
                        </a>
                    </div>
                    <div className="space-y-2">
                        <h2 className="font-semibold text-slate-900">
                            Conócenos
                        </h2>
                        {navItems.slice(1).map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className="block text-slate-600 hover:text-green-700"
                            >
                                {item.title}
                            </Link>
                        ))}
                    </div>
                    <div className="space-y-3">
                        <h2 className="font-semibold text-slate-900">
                            Atención al cliente
                        </h2>
                        <Link
                            href={complaintsCreate()}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-800 px-3 py-2 font-semibold text-slate-800 transition hover:bg-slate-800 hover:text-white"
                        >
                            📕 Libro de Reclamaciones
                        </Link>
                        <p className="text-xs text-slate-500">
                            Tus datos se tratan conforme a la Ley N° 29733 de
                            Protección de Datos Personales.
                        </p>
                    </div>
                </div>
                <div className="border-t border-amber-100 py-4 text-center text-xs text-slate-500">
                    © {new Date().getFullYear()} EP Villa Jardín · Ica, Perú
                </div>
            </footer>
        </div>
    );
}

/** Encabezado colorido para las páginas internas del sitio. */
export function PageHero({
    title,
    subtitle,
    emoji,
}: {
    title: string;
    subtitle?: string | null;
    emoji?: string;
}) {
    return (
        <section className="relative overflow-hidden">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-20 -left-16 size-60 rounded-full bg-amber-200/60 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute top-10 -right-16 size-60 rounded-full bg-sky-200/60 blur-3xl"
            />
            <div className="relative mx-auto max-w-4xl space-y-4 px-4 py-14 text-center">
                {emoji && (
                    <div className="text-5xl" aria-hidden>
                        {emoji}
                    </div>
                )}
                <h1 className="font-display text-4xl font-extrabold text-slate-900 sm:text-5xl">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mx-auto max-w-2xl text-lg text-slate-600">
                        {subtitle}
                    </p>
                )}
            </div>
        </section>
    );
}
