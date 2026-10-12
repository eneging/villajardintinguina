import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { NativeSelect } from '@/components/school/native-select';
import { Pagination } from '@/components/school/pagination';
import type { Paginated } from '@/components/school/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { create, edit, index } from '@/routes/admin/users';
import type { Option, Role } from '@/types';

type UserRow = {
    id: number;
    name: string;
    email: string;
    dni: string | null;
    phone: string | null;
    active: boolean;
    roles: Role[];
    children: string[];
};

type Props = {
    users: Paginated<UserRow>;
    filters: { search: string; role: string };
    roles: Option[];
};

export default function UsersIndex({ users, filters, roles }: Props) {
    const [search, setSearch] = useState(filters.search);
    const roleLabel = (role: string) =>
        roles.find((r) => r.value === role)?.label ?? role;

    function apply(next: Partial<Props['filters']>) {
        router.get(
            index.url(),
            { ...filters, search, ...next },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Personas" />
            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Personas"
                        description="Cuentas de padres, maestras, practicantes y administración."
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> Nueva persona
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
                        placeholder="Buscar por nombre, correo, DNI o celular"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <NativeSelect
                        className="w-48"
                        value={filters.role}
                        placeholder="Todos los roles"
                        options={roles}
                        onChange={(e) => apply({ role: e.target.value })}
                    />
                    <Button type="submit" variant="outline">
                        <Search /> Buscar
                    </Button>
                </form>

                <div className="overflow-x-auto rounded-2xl border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3 font-medium">Nombre</th>
                                <th className="p-3 font-medium">Contacto</th>
                                <th className="p-3 font-medium">Roles</th>
                                <th className="p-3 font-medium">Hijos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-accent">
                                    <td className="p-3">
                                        <Link
                                            href={edit(user.id)}
                                            className="font-medium underline-offset-4 hover:underline"
                                        >
                                            {user.name}
                                        </Link>
                                        {!user.active && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-2"
                                            >
                                                Inactiva
                                            </Badge>
                                        )}
                                        {user.dni && (
                                            <div className="text-muted-foreground">
                                                DNI {user.dni}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <div>{user.email}</div>
                                        <div className="text-muted-foreground">
                                            {user.phone}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.map((role) => (
                                                <Badge
                                                    key={role}
                                                    variant="outline"
                                                >
                                                    {roleLabel(role)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {user.children.join(', ')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.data.length === 0 && (
                        <p className="p-8 text-center text-muted-foreground">
                            No hay resultados.
                        </p>
                    )}
                </div>
                <Pagination page={users} />
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Personas', href: index() }],
};
