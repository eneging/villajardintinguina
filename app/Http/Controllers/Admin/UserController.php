<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Personas con acceso a la plataforma: padres, maestras, practicantes y administración.
 * No hay registro público: la administradora crea todas las cuentas.
 */
class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::enum(Role::class)],
        ]);

        $users = User::query()
            ->with(['roleAssignments', 'children'])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('dni', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")))
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->whereHas('roleAssignments', fn ($q) => $q->where('role', $role)))
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users->through(fn (User $user) => [
                ...$this->present($user),
                'children' => $user->children->map(fn ($child) => $child->fullName())->values(),
            ]),
            'filters' => [
                'search' => $filters['search'] ?? '',
                'role' => $filters['role'] ?? '',
            ],
            'roles' => self::roleOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/users/form', [
            'user' => null,
            'roles' => self::roleOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                ...collect($data)->except(['roles', 'password'])->all(),
                // Sin contraseña inicial: se le envía un enlace para crearla.
                'password' => $data['password'] ?? Str::password(32),
                'email_verified_at' => now(),
            ]);
            $this->syncRoles($user, $data['roles']);

            return $user;
        });

        $message = 'Cuenta creada.';

        if (empty($data['password'])) {
            Password::sendResetLink(['email' => $user->email]);
            $message = 'Cuenta creada. Enviamos un enlace a su correo para que cree su contraseña.';
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('admin.users.index');
    }

    public function edit(User $user): Response
    {
        $user->load('roleAssignments');

        return Inertia::render('admin/users/form', [
            'user' => $this->present($user),
            'roles' => self::roleOptions(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $this->validated($request, $user);

        abort_if(
            $user->is($request->user()) && (! in_array(Role::Admin->value, $data['roles'], true) || ! $data['active']),
            422,
            'No puedes quitarte el rol de administradora ni desactivar tu propia cuenta.',
        );

        DB::transaction(function () use ($user, $data) {
            $user->update(collect($data)->except(['roles', 'password'])->all());

            if (! empty($data['password'])) {
                $user->update(['password' => $data['password']]);
            }

            $this->syncRoles($user, $data['roles']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cuenta actualizada.']);

        return to_route('admin.users.index');
    }

    /**
     * Reenvía el enlace para crear o recuperar la contraseña.
     */
    public function sendAccess(User $user): RedirectResponse
    {
        Password::sendResetLink(['email' => $user->email]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Enviamos el enlace de acceso a {$user->email}."]);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user)],
            'dni' => ['nullable', 'string', 'max:12', Rule::unique('users', 'dni')->ignore($user)],
            'phone' => ['nullable', 'string', 'max:20'],
            'active' => ['boolean'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => [Rule::enum(Role::class)],
            'password' => ['nullable', 'string', PasswordRule::min(8)],
        ], [], [
            'name' => 'nombre',
            'email' => 'correo',
            'phone' => 'celular',
            'roles' => 'roles',
            'password' => 'contraseña',
        ]);
    }

    /**
     * @param  list<string>  $roles
     */
    private function syncRoles(User $user, array $roles): void
    {
        $user->roleAssignments()->whereNotIn('role', $roles)->delete();

        foreach ($roles as $role) {
            $user->assignRole(Role::from($role));
        }

        $user->unsetRelation('roleAssignments');
    }

    /**
     * @return array<string, mixed>
     */
    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'dni' => $user->dni,
            'phone' => $user->phone,
            'active' => $user->active,
            'roles' => array_map(fn (Role $role) => $role->value, $user->roles()),
        ];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function roleOptions(): array
    {
        // Los alumnos (niños de 0 a 5 años) no inician sesión: los ven sus padres.
        return array_values(array_map(
            fn (Role $role) => ['value' => $role->value, 'label' => $role->label()],
            array_filter(Role::cases(), fn (Role $role) => $role !== Role::Student),
        ));
    }
}
