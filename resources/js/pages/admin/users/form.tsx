import { Head, Link, router, useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { access, index } from '@/routes/admin/users';
import type { Option, Role } from '@/types';

type Props = {
    user: {
        id: number;
        name: string;
        email: string;
        dni: string | null;
        phone: string | null;
        active: boolean;
        roles: Role[];
    } | null;
    roles: Option[];
};

export default function UserForm({ user, roles }: Props) {
    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        dni: user?.dni ?? '',
        phone: user?.phone ?? '',
        active: user?.active ?? true,
        roles: user?.roles ?? (['parent'] as string[]),
        password: '',
    });
    const { data, setData, errors, processing } = form;
    const allErrors = errors as Record<string, string | undefined>;

    return (
        <>
            <Head title={user ? user.name : 'Nueva persona'} />
            <form
                className="mx-auto w-full max-w-2xl space-y-6 p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.submit(
                        user
                            ? UserController.update(user.id)
                            : UserController.store(),
                    );
                }}
            >
                <Heading
                    title={user ? 'Editar persona' : 'Nueva persona'}
                    description="Los padres solo ven a sus hijos; las maestras, sus salones."
                />

                <section className="space-y-4 rounded-2xl border bg-card p-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                            />
                            <InputError message={errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">
                                Celular (para recordatorios por WhatsApp)
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                                placeholder="987654321"
                            />
                            <InputError message={errors.phone} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dni">DNI</Label>
                            <Input
                                id="dni"
                                inputMode="numeric"
                                value={data.dni}
                                onChange={(e) => setData('dni', e.target.value)}
                            />
                            <InputError message={errors.dni} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                {user
                                    ? 'Nueva contraseña (opcional)'
                                    : 'Contraseña inicial (opcional)'}
                            </Label>
                            <Input
                                id="password"
                                type="text"
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />
                            {!user && (
                                <p className="text-xs text-muted-foreground">
                                    Si la dejas vacía, le enviaremos un enlace
                                    por correo para que cree la suya.
                                </p>
                            )}
                            <InputError message={errors.password} />
                        </div>
                    </div>
                </section>

                <section className="space-y-3 rounded-2xl border bg-card p-5">
                    <Label>Roles</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {roles.map((role) => (
                            <div
                                key={role.value}
                                className="flex items-center gap-3"
                            >
                                <Checkbox
                                    id={`role-${role.value}`}
                                    checked={data.roles.includes(role.value)}
                                    onCheckedChange={(checked) =>
                                        setData(
                                            'roles',
                                            checked === true
                                                ? [...data.roles, role.value]
                                                : data.roles.filter(
                                                      (r) => r !== role.value,
                                                  ),
                                        )
                                    }
                                />
                                <Label htmlFor={`role-${role.value}`}>
                                    {role.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                    <InputError
                        message={errors.roles ?? allErrors['roles.0']}
                    />
                    <div className="flex items-center gap-3 border-t pt-3">
                        <Checkbox
                            id="active"
                            checked={data.active}
                            onCheckedChange={(checked) =>
                                setData('active', checked === true)
                            }
                        />
                        <Label htmlFor="active">
                            Cuenta activa (puede iniciar sesión)
                        </Label>
                    </div>
                </section>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    {user ? (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.post(access.url(user.id))}
                        >
                            <Mail /> Enviar enlace de acceso
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

UserForm.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Personas', href: index() },
        { title: props.user ? props.user.name : 'Nueva', href: index() },
    ],
});
