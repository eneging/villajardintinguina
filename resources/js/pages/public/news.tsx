import { Head } from '@inertiajs/react';
import { Pagination } from '@/components/school/pagination';
import type { Paginated } from '@/components/school/pagination';
import { PostCard } from '@/components/school/post-card';
import { PageHero, PublicLayout } from '@/components/school/public-layout';
import type { PostCard as Post } from '@/types';

export default function News({ posts }: { posts: Paginated<Post> }) {
    return (
        <PublicLayout width="full">
            <Head title="Noticias" />
            <PageHero
                title="Noticias"
                subtitle="Actividades, logros de nuestros niños y consejos para las familias."
                emoji="📰"
            />
            <section className="mx-auto max-w-6xl space-y-6 px-4 pb-20">
                {posts.data.length === 0 ? (
                    <p className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
                        Muy pronto publicaremos nuestras primeras noticias.
                    </p>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.data.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
                <Pagination page={posts} />
            </section>
        </PublicLayout>
    );
}
