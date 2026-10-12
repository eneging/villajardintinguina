import { Head, Link } from '@inertiajs/react';
import { PlayCircle } from 'lucide-react';
import { PageHero, PublicLayout } from '@/components/school/public-layout';
import { show } from '@/routes/videos';
import type { PublicLessonCard } from '@/types';

export default function Videos({ lessons }: { lessons: PublicLessonCard[] }) {
    return (
        <PublicLayout width="full">
            <Head title="Videos" />
            <PageHero
                title="Conócenos en video"
                subtitle="Recorre el colegio, conoce a las maestras y descubre cómo es un día en Villa Jardín."
                emoji="🎬"
            />
            <section className="mx-auto max-w-6xl px-4 pb-20">
                {lessons.length === 0 ? (
                    <p className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
                        Muy pronto publicaremos nuestros videos de presentación.
                    </p>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {lessons.map((lesson) => (
                            <Link
                                key={lesson.id}
                                href={show(lesson.id)}
                                className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="relative aspect-video bg-green-100">
                                    {lesson.cover?.thumbnail && (
                                        <img
                                            src={lesson.cover.thumbnail}
                                            alt=""
                                            loading="lazy"
                                            className="size-full object-cover"
                                        />
                                    )}
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/10 text-white transition group-hover:bg-black/25">
                                        <PlayCircle className="size-14 drop-shadow" />
                                    </span>
                                </div>
                                <div className="space-y-1 p-5">
                                    <h2 className="font-display text-lg font-bold group-hover:text-green-700">
                                        {lesson.title}
                                    </h2>
                                    {lesson.description && (
                                        <p className="line-clamp-3 text-sm text-slate-600">
                                            {lesson.description}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </PublicLayout>
    );
}
