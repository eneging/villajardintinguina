import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { BlockRenderer } from '@/components/school/block-renderer';
import { PublicLayout } from '@/components/school/public-layout';
import { admission, videos } from '@/routes';
import type { ContentBlock, PublicLessonCard } from '@/types';

export default function Video({
    lesson,
}: {
    lesson: PublicLessonCard & { blocks: ContentBlock[] };
}) {
    return (
        <PublicLayout>
            <Head title={lesson.title} />
            <article className="space-y-8">
                <Link
                    href={videos()}
                    className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:underline"
                >
                    <ArrowLeft className="size-4" /> Todos los videos
                </Link>
                <header className="space-y-3">
                    <h1 className="font-display text-4xl font-extrabold text-slate-900">
                        {lesson.title}
                    </h1>
                    {lesson.description && (
                        <p className="text-lg text-slate-600">
                            {lesson.description}
                        </p>
                    )}
                </header>
                <div className="space-y-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
                    {lesson.blocks.map((block, index) => (
                        <BlockRenderer key={block.id ?? index} block={block} />
                    ))}
                </div>
                <div className="rounded-3xl bg-green-600 p-8 text-center text-white">
                    <p className="mb-4 font-display text-2xl font-bold">
                        ¿Te gustaría que tu hijo sea parte de Villa Jardín?
                    </p>
                    <Link
                        href={admission()}
                        className="inline-flex rounded-full bg-white px-6 py-3 font-semibold text-green-700 hover:bg-green-50"
                    >
                        Solicitar vacante
                    </Link>
                </div>
            </article>
        </PublicLayout>
    );
}
