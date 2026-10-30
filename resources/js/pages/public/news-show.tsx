import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { day } from '@/components/billing/format';
import { PostCard } from '@/components/school/post-card';
import { PublicLayout } from '@/components/school/public-layout';
import { news } from '@/routes';
import type { PostCard as Post } from '@/types';

type Props = {
    post: Post & { body: string; author: string | null };
    more: Post[];
};

export default function NewsShow({ post, more }: Props) {
    return (
        <PublicLayout width="full">
            <Head title={post.title}>
                {post.excerpt && (
                    <meta name="description" content={post.excerpt} />
                )}
            </Head>
            <article className="mx-auto max-w-3xl space-y-6 px-4 py-10">
                <Link
                    href={news()}
                    className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:underline"
                >
                    <ArrowLeft className="size-4" /> Todas las noticias
                </Link>
                <header className="space-y-2">
                    <h1 className="font-display text-4xl font-extrabold text-slate-900">
                        {post.title}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {post.published_at && day(post.published_at)}
                        {post.author && ` · ${post.author}`}
                    </p>
                </header>
                {post.cover && (
                    <img
                        src={post.cover.url}
                        alt=""
                        className="w-full rounded-3xl object-cover shadow-sm"
                    />
                )}
                <div className="space-y-4 text-lg leading-relaxed text-slate-700">
                    {post.body.split(/\n{2,}/).map((paragraph, index) => (
                        <p key={index} className="whitespace-pre-line">
                            {paragraph}
                        </p>
                    ))}
                </div>
            </article>
            {more.length > 0 && (
                <section className="mx-auto max-w-6xl space-y-6 px-4 pb-20">
                    <h2 className="font-display text-2xl font-bold text-slate-900">
                        Más noticias
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-3">
                        {more.map((item) => (
                            <PostCard key={item.id} post={item} />
                        ))}
                    </div>
                </section>
            )}
        </PublicLayout>
    );
}
