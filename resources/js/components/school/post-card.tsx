import { Link } from '@inertiajs/react';
import { day } from '@/components/billing/format';
import { show } from '@/routes/news';
import type { PostCard as Post } from '@/types';

export function PostCard({ post }: { post: Post }) {
    return (
        <Link
            href={show(post.slug)}
            className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
            <div className="aspect-[16/9] bg-amber-100">
                {post.cover?.thumbnail ? (
                    <img
                        src={post.cover.thumbnail}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                    />
                ) : (
                    <div
                        className="flex size-full items-center justify-center text-5xl"
                        aria-hidden
                    >
                        📰
                    </div>
                )}
            </div>
            <div className="space-y-1 p-5">
                {post.published_at && (
                    <p className="text-xs font-medium text-green-700">
                        {day(post.published_at)}
                    </p>
                )}
                <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-green-700">
                    {post.title}
                </h3>
                {post.excerpt && (
                    <p className="line-clamp-3 text-sm text-slate-600">
                        {post.excerpt}
                    </p>
                )}
            </div>
        </Link>
    );
}
