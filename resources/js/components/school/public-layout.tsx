import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { create as complaintsCreate } from '@/routes/complaints';

/** Marco simple para páginas públicas (Libro de Reclamaciones, etc.). */
export function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#fffaf0] text-slate-800 print:bg-white">
            <header className="border-b border-amber-100 bg-[#fffaf0] print:hidden">
                <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                    <Link href={home()} className="flex items-center gap-2">
                        <AppLogoIcon className="size-8 fill-green-600" />
                        <span className="font-display text-lg font-bold text-green-700">
                            Villa Jardín
                        </span>
                    </Link>
                    <Link
                        href={home()}
                        className="text-sm font-medium hover:text-green-700"
                    >
                        Volver al inicio
                    </Link>
                </nav>
            </header>
            <main className="mx-auto max-w-4xl px-4 py-10 print:p-0">
                {children}
            </main>
            <footer className="border-t border-amber-100 bg-white print:hidden">
                <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500">
                    <p>
                        © {new Date().getFullYear()} EP Villa Jardín · Ica, Perú
                    </p>
                    <Link
                        href={complaintsCreate()}
                        className="font-medium text-slate-700 hover:underline"
                    >
                        📕 Libro de Reclamaciones
                    </Link>
                </div>
            </footer>
        </div>
    );
}
