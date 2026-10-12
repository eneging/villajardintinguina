import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, Plus, Users } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { create } from '@/routes/admin/classrooms';
import { index, show } from '@/routes/classrooms';
import type { ClassroomSummary } from '@/types';

export default function ClassroomsIndex({
    classrooms,
}: {
    classrooms: ClassroomSummary[];
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Salones" />
            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Salones"
                        description="Elige un salón para publicar módulos de aprendizaje y ver su información."
                    />
                    {auth.roles.includes('admin') && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus /> Nuevo salón
                            </Link>
                        </Button>
                    )}
                </div>
                {classrooms.length === 0 && (
                    <p className="text-muted-foreground">
                        Aún no tienes salones asignados este año.
                    </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {classrooms.map((classroom) => (
                        <ClassroomTile
                            key={classroom.id}
                            classroom={classroom}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

export function ClassroomTile({ classroom }: { classroom: ClassroomSummary }) {
    return (
        <Link
            href={show(classroom.id)}
            className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div
                className="flex h-24 items-center justify-center text-5xl"
                style={{ backgroundColor: `${classroom.color}2e` }}
                aria-hidden
            >
                {classroom.mascot ?? '🏫'}
            </div>
            <div className="space-y-1 p-4">
                <h3 className="text-lg font-semibold group-hover:underline">
                    {classroom.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {classroom.level}
                </p>
                <div className="flex gap-4 pt-2 text-sm text-muted-foreground">
                    {classroom.students_count != null && (
                        <span className="flex items-center gap-1">
                            <Users className="size-4" />{' '}
                            {classroom.students_count}
                        </span>
                    )}
                    {classroom.published_modules_count != null && (
                        <span className="flex items-center gap-1">
                            <BookOpen className="size-4" />{' '}
                            {classroom.published_modules_count} publicados
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

ClassroomsIndex.layout = {
    breadcrumbs: [{ title: 'Salones', href: index() }],
};
