import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { day } from '@/components/billing/format';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { create, edit, index } from '@/routes/admin/posts';
import type { PostCard } from '@/types';

export default function PostsIndex({
    posts,
}: {
    posts: (PostCard & { published: boolean })[];
}) {
    return (
        <>
            <Head title="Noticias" />
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Noticias del sitio web"
                        description="Actividades y consejos para las familias. Ayudan a que el colegio aparezca en Google."
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> Nueva noticia
                        </Link>
                    </Button>
                </div>
                <ul className="divide-y rounded-2xl border bg-card">
                    {posts.map((post) => (
                        <li key={post.id}>
                            <Link
                                href={edit(post.id)}
                                className="flex items-center gap-3 p-4 hover:bg-accent"
                            >
                                {post.cover?.thumbnail ? (
                                    <img
                                        src={post.cover.thumbnail}
                                        alt=""
                                        className="h-14 w-20 rounded-lg object-cover"
                                    />
                                ) : (
                                    <span className="flex h-14 w-20 items-center justify-center rounded-lg bg-muted text-2xl">
                                        📰
                                    </span>
                                )}
                                <span className="min-w-0 flex-1">
                                    <span className="block font-medium">
                                        {post.title}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {post.published && post.published_at
                                            ? `Publicada el ${day(post.published_at)}`
                                            : 'Borrador'}
                                    </span>
                                </span>
                                {!post.published && (
                                    <Badge variant="secondary">Borrador</Badge>
                                )}
                            </Link>
                        </li>
                    ))}
                    {posts.length === 0 && (
                        <li className="p-8 text-center text-muted-foreground">
                            Aún no hay noticias.
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
}

PostsIndex.layout = { breadcrumbs: [{ title: 'Noticias', href: index() }] };
