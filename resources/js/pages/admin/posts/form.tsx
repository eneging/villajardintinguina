import { Head, Link, router, useForm } from '@inertiajs/react';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useState } from 'react';
import PostController from '@/actions/App/Http/Controllers/Admin/PostController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { MediaUploader } from '@/components/school/media-uploader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/posts';
import { show as publicShow } from '@/routes/news';
import type { MediaItem } from '@/types';

type Props = {
    post: {
        id: number;
        title: string;
        excerpt: string | null;
        body: string;
        cover_media_id: number | null;
        cover: MediaItem | null;
        slug: string;
        published: boolean;
    } | null;
    cloudinaryEnabled: boolean;
};

const textareaClass =
    'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

export default function PostForm({ post, cloudinaryEnabled }: Props) {
    const [cover, setCover] = useState<MediaItem | null>(post?.cover ?? null);
    const form = useForm({
        title: post?.title ?? '',
        excerpt: post?.excerpt ?? '',
        body: post?.body ?? '',
        cover_media_id: post?.cover_media_id ?? (null as number | null),
        published: post?.published ?? false,
    });
    const { data, setData, errors, processing } = form;

    return (
        <>
            <Head title={post ? post.title : 'Nueva noticia'} />
            <form
                className="mx-auto w-full max-w-3xl space-y-5 p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.submit(
                        post
                            ? PostController.update(post.id)
                            : PostController.store(),
                    );
                }}
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title={post ? 'Editar noticia' : 'Nueva noticia'}
                    />
                    {post?.published && (
                        <Button variant="outline" asChild>
                            <a
                                href={publicShow(post.slug).url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink /> Ver en el sitio
                            </a>
                        </Button>
                    )}
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="title">Título</Label>
                    <Input
                        id="title"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                    />
                    <InputError message={errors.title} />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="excerpt">
                        Resumen (aparece en la tarjeta y en Google)
                    </Label>
                    <textarea
                        id="excerpt"
                        rows={2}
                        className={textareaClass}
                        value={data.excerpt}
                        onChange={(e) => setData('excerpt', e.target.value)}
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label>Imagen de portada</Label>
                    {cover?.thumbnail && (
                        <img
                            src={cover.thumbnail}
                            alt=""
                            className="h-36 w-fit rounded-xl object-cover"
                        />
                    )}
                    <MediaUploader
                        target={{ context: 'site' }}
                        resourceType="image"
                        label={cover ? 'Cambiar imagen' : 'Subir imagen'}
                        disabled={!cloudinaryEnabled}
                        onUploaded={(media) => {
                            setCover(media);
                            setData('cover_media_id', media.id);
                        }}
                    />
                    <InputError message={errors.cover_media_id} />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="body">
                        Texto (deja una línea en blanco entre párrafos)
                    </Label>
                    <textarea
                        id="body"
                        rows={14}
                        className={textareaClass}
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                    />
                    <InputError message={errors.body} />
                </div>
                <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                        checked={data.published}
                        onCheckedChange={(c) =>
                            setData('published', c === true)
                        }
                    />
                    Publicar en el sitio web
                </label>
                <div className="flex flex-wrap justify-between gap-2">
                    {post ? (
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() =>
                                confirm('¿Eliminar esta noticia?') &&
                                router.delete(
                                    PostController.destroy.url(post.id),
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

PostForm.layout = { breadcrumbs: [{ title: 'Noticias', href: index() }] };
