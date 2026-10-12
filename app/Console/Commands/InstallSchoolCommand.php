<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Database\Seeders\SchoolSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Prepara el colegio en producción (idempotente): año escolar, niveles, salones,
 * categorías de gastos y la primera cuenta de administradora.
 */
class InstallSchoolCommand extends Command
{
    protected $signature = 'escuela:instalar
        {--email= : Correo de la administradora (por defecto INSTALL_ADMIN_EMAIL)}
        {--name= : Nombre de la administradora (por defecto INSTALL_ADMIN_NAME)}';

    protected $description = 'Crea la estructura base del colegio y la primera administradora';

    public function handle(): int
    {
        $this->callSilently('db:seed', ['--class' => SchoolSeeder::class, '--force' => true]);
        $this->info('Estructura del colegio lista (año escolar, niveles, salones, categorías).');

        if (User::whereHas('roleAssignments', fn ($q) => $q->where('role', Role::Admin))->exists()) {
            $this->info('Ya existe una administradora: no se crea otra.');

            return self::SUCCESS;
        }

        $email = $this->option('email') ?: config('school.install.admin_email');

        if (! $email) {
            $this->warn('Define INSTALL_ADMIN_EMAIL en .env (o usa --email) para crear la administradora.');

            return self::SUCCESS;
        }

        $user = User::create([
            'name' => $this->option('name') ?: config('school.install.admin_name'),
            'email' => $email,
            'password' => config('school.install.admin_password') ?: Str::password(32),
            'email_verified_at' => now(),
        ]);
        $user->assignRole(Role::Admin);

        if (! config('school.install.admin_password')) {
            Password::sendResetLink(['email' => $email]);
            $this->info("Administradora creada: enviamos a {$email} el enlace para crear su contraseña.");
        } else {
            $this->info("Administradora creada: {$email} (cambia la contraseña al entrar y borra INSTALL_ADMIN_PASSWORD del .env).");
        }

        return self::SUCCESS;
    }
}
