import { Head, useForm } from '@inertiajs/react';
import { Megaphone } from 'lucide-react';
import AnnouncementController from '@/actions/App/Http/Controllers/AnnouncementController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AnnouncementCard } from '@/components/school/announcement-card';
import { textareaClass } from '@/components/school/block-editor';
import { NativeSelect } from '@/components/school/native-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/announcements';
import type { Announcement } from '@/types';

type Target = { value: number | null; label: string };

export default function Announcements({
    announcements,
    targets,
}: {
    announcements: Announcement[];
    targets: Target[];
}) {
    const form = useForm({
        classroom_id: targets[0]?.value ?? null,
        title: '',
        body: '',
        pinned: false,
    });

    return (
        <>
            <Head title="Comunicados" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <Heading
                    title="Comunicados"
                    description="Avisos del colegio y de los salones."
                />

                {targets.length > 0 && (
                    <form
                        className="space-y-3 rounded-2xl border bg-card p-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.submit(AnnouncementController.store(), {
                                preserveScroll: true,
                                onSuccess: () =>
                                    form.reset('title', 'body', 'pinned'),
                            });
                        }}
                    >
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Megaphone className="size-4" /> Nuevo comunicado
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
                            <div className="grid gap-1">
                                <Label htmlFor="classroom_id">Para</Label>
                                <NativeSelect
                                    id="classroom_id"
                                    value={form.data.classroom_id ?? ''}
                                    options={targets.map((t) => ({
                                        value: t.value ?? '',
                                        label: t.label,
                                    }))}
                                    onChange={(e) =>
                                        form.setData(
                                            'classroom_id',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : null,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="title">Título</Label>
                                <Input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(e) =>
                                        form.setData('title', e.target.value)
                                    }
                                    placeholder="Reunión de padres el viernes"
                                />
                                <InputError message={form.errors.title} />
                            </div>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="body">Mensaje</Label>
                            <textarea
                                id="body"
                                className={textareaClass}
                                value={form.data.body}
                                onChange={(e) =>
                                    form.setData('body', e.target.value)
                                }
                            />
                            <InputError message={form.errors.body} />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.data.pinned}
                                    onCheckedChange={(c) =>
                                        form.setData('pinned', c === true)
                                    }
                                />{' '}
                                Fijar arriba
                            </label>
                            <Button type="submit" disabled={form.processing}>
                                Publicar
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Después de publicar, usa el ícono de WhatsApp para
                            reenviarlo al grupo de padres.
                        </p>
                    </form>
                )}

                <div className="space-y-3">
                    {announcements.map((announcement) => (
                        <AnnouncementCard
                            key={announcement.id}
                            announcement={announcement}
                        />
                    ))}
                    {announcements.length === 0 && (
                        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                            Aún no hay comunicados.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

Announcements.layout = {
    breadcrumbs: [{ title: 'Comunicados', href: index() }],
};
