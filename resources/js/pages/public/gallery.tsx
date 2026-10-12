import { Head } from '@inertiajs/react';
import { AlbumCard } from '@/components/gallery/album-card';
import { PageHero, PublicLayout } from '@/components/school/public-layout';
import { show } from '@/routes/photos';
import type { AlbumCard as Album } from '@/types';

export default function Gallery({ albums }: { albums: Album[] }) {
    return (
        <PublicLayout width="full">
            <Head title="Fotos" />
            <PageHero
                title="Momentos en Villa Jardín"
                subtitle="Celebraciones, paseos y actividades. Solo mostramos fotos de niños cuyas familias autorizaron el uso de su imagen."
                emoji="📸"
            />
            <section className="mx-auto max-w-6xl px-4 pb-20">
                {albums.length === 0 ? (
                    <p className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
                        Muy pronto compartiremos fotos de nuestras actividades.
                    </p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {albums.map((album) => (
                            <AlbumCard
                                key={album.id}
                                album={album}
                                href={show(album.id).url}
                            />
                        ))}
                    </div>
                )}
            </section>
        </PublicLayout>
    );
}
