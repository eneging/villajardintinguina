import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { NativeSelect } from '@/components/school/native-select';
import { Pagination } from '@/components/school/pagination';
import type { Paginated } from '@/components/school/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { create, edit, index } from '@/routes/admin/students';
import { show } from '@/routes/students';

type StudentRow = {
    id: number;
    name: string;
    dni: string | null;
    classroom: string | null;
    guardians: string[];
};

type Props = {
    students: Paginated<StudentRow>;
    filters: { search: string; classroom: string };
    classrooms: { value: number; label: string }[];
    year: number | null;
};

export default function StudentsIndex({
    students,
    filters,
    classrooms,
    year,
}: Props) {
    const [search, setSearch] = useState(filters.search);

    function apply(next: Partial<Props['filters']>) {
        router.get(
            index.url(),
            { ...filters, search, ...next },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Alumnos" />
            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Alumnos"
                        description={`Fichas, apoderados y matrícula ${year ?? ''}.`}
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> Nuevo alumno
                        </Link>
                    </Button>
                </div>

                <form
                    className="flex flex-wrap gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        apply({});
                    }}
                >
                    <Input
                        className="max-w-xs"
                        placeholder="Buscar por nombre o DNI"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <NativeSelect
                        className="w-56"
                        value={filters.classroom}
                        placeholder="Todos los salones"
                        options={classrooms}
                        onChange={(e) => apply({ classroom: e.target.value })}
                    />
                    <Button type="submit" variant="outline">
                        <Search /> Buscar
                    </Button>
                </form>

                <div className="overflow-x-auto rounded-2xl border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3 font-medium">Alumno</th>
                                <th className="p-3 font-medium">Salón</th>
                                <th className="p-3 font-medium">Apoderados</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {students.data.map((student) => (
                                <tr
                                    key={student.id}
                                    className="hover:bg-accent"
                                >
                                    <td className="p-3">
                                        <Link
                                            href={show(student.id)}
                                            className="font-medium underline-offset-4 hover:underline"
                                        >
                                            {student.name}
                                        </Link>{' '}
                                        <Link
                                            href={edit(student.id)}
                                            className="text-xs text-muted-foreground hover:underline"
                                        >
                                            Editar
                                        </Link>
                                        {student.dni && (
                                            <div className="text-muted-foreground">
                                                DNI {student.dni}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {student.classroom ?? (
                                            <span className="text-muted-foreground">
                                                Sin matrícula
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {student.guardians.join(', ')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {students.data.length === 0 && (
                        <p className="p-8 text-center text-muted-foreground">
                            No hay alumnos registrados.
                        </p>
                    )}
                </div>
                <Pagination page={students} />
            </div>
        </>
    );
}

StudentsIndex.layout = {
    breadcrumbs: [{ title: 'Alumnos', href: index() }],
};
