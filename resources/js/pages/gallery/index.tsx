import { Head, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import GalleryController from '@/actions/App/Http/Controllers/GalleryController';
import { AlbumCard } from '@/components/gallery/album-card';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localToday } from '@/lib/school';
import { show as showClassroom } from '@/routes/classrooms';
import { index } from '@/routes/gallery';
import type { AlbumCard as Album } from '@/types';

type Props = {
    classroom: {
        id: number;
        name: string;
        color: string;
        mascot: string | null;
    };
    albums: Album[];
    canManage: boolean;
};

export default function GalleryIndex({ classroom, albums, canManage }: Props) {
    const form = useForm({ title: '', date: localToday(), description: '' });

    return (
        <>
            <Head title={`Galería · ${classroom.name}`} />
            <div className="space-y-6 p-4">
                <Heading
                    title={`${classroom.mascot ?? ''} Galería del salón ${classroom.name}`}
                    description="Fotos y videos privados: solo los ven las familias y el personal de este salón."
                />

                {canManage && (
                    <form
                        className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_11rem_auto] sm:items-end"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.submit(GalleryController.store(classroom.id));
                        }}
                    >
                        <div className="grid gap-1">
                            <Label htmlFor="album_title">Nuevo álbum</Label>
                            <Input
                                id="album_title"
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                                placeholder="Paseo a la granja"
                            />
                            <InputError message={form.errors.title} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="album_date">Fecha</Label>
                            <Input
                                id="album_date"
                                type="date"
                                value={form.data.date}
                                onChange={(e) =>
                                    form.setData('date', e.target.value)
                                }
                            />
                            <InputError message={form.errors.date} />
                        </div>
                        <Button type="submit" disabled={form.processing}>
                            <Plus /> Crear álbum
                        </Button>
                    </form>
                )}

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {albums.map((album) => (
                        <AlbumCard
                            key={album.id}
                            album={album}
                            color={classroom.color}
                        />
                    ))}
                </div>
                {albums.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                        {canManage
                            ? 'Crea el primer álbum y sube las fotos de las actividades.'
                            : 'Pronto verás aquí las fotos de las actividades del salón. 📸'}
                    </p>
                )}
            </div>
        </>
    );
}

GalleryIndex.layout = (props: Props) => ({
    breadcrumbs: [
        {
            title: `Salón ${props.classroom.name}`,
            href: showClassroom(props.classroom.id),
        },
        { title: 'Galería', href: index(props.classroom.id) },
    ],
});
