<?php

namespace Database\Seeders;

use App\Enums\ClassroomStaffRole;
use App\Enums\LearningArea;
use App\Enums\ModuleStatus;
use App\Enums\Role;
use App\Models\Classroom;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Usuarios y datos de prueba (solo para desarrollo). Contraseña de todos: "password".
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $year = SchoolYear::current();
        $patitos = Classroom::where('slug', 'patitos')->whereBelongsTo($year)->firstOrFail();

        $this->user('Administradora', 'admin@villajardin.test', Role::Admin);
        $teacher = $this->user('Miss Rosa', 'maestra@villajardin.test', Role::Teacher);
        $intern = $this->user('Practicante Lucía', 'practicante@villajardin.test', Role::Intern);
        $parent = $this->user('Carmen Quispe', 'padre@villajardin.test', Role::Parent);

        $patitos->staff()->syncWithoutDetaching([
            $teacher->id => ['role' => ClassroomStaffRole::Lead->value],
            $intern->id => ['role' => ClassroomStaffRole::Intern->value],
        ]);

        $student = Student::firstOrCreate(
            ['dni' => '90000001'],
            ['first_name' => 'Sofía', 'last_name' => 'Quispe', 'birth_date' => now()->subYears(3)->subMonths(4), 'sex' => 'F', 'image_consent' => true],
        );
        $student->guardians()->syncWithoutDetaching([$parent->id => ['relationship' => 'madre', 'is_billing_contact' => true]]);
        $student->enrollments()->firstOrCreate(
            ['school_year_id' => $year->id],
            ['classroom_id' => $patitos->id, 'monthly_fee' => 350],
        );

        if ($patitos->learningModules()->doesntExist()) {
            $module = $patitos->learningModules()->create([
                'author_id' => $teacher->id,
                'title' => 'Conocemos los animales de la granja',
                'area' => LearningArea::Science,
                'summary' => 'Durante dos semanas exploraremos los animales de la granja: cómo son, qué comen y qué sonidos hacen.',
                'goals' => [
                    'Reconoce y nombra 5 animales de la granja.',
                    'Imita los sonidos de los animales.',
                    'Relaciona cada animal con lo que nos da (leche, huevos, lana).',
                ],
                'starts_on' => now()->startOfWeek(),
                'ends_on' => now()->startOfWeek()->addDays(11),
                'status' => ModuleStatus::Published,
                'published_at' => now(),
            ]);

            $module->blocks()->createMany([
                ['type' => 'text', 'position' => 0, 'content' => ['body' => "Querida familia:\n\nEstas semanas los Patitos visitarán (¡con la imaginación!) una granja. Cantaremos, haremos títeres y jugaremos a adivinar sonidos."]],
                ['type' => 'video', 'position' => 1, 'content' => ['caption' => 'Canción de la granja que cantaremos en clase', 'youtube_url' => 'https://www.youtube.com/watch?v=zXEq-QO3xTg']],
                ['type' => 'activity', 'position' => 2, 'content' => ['title' => 'Actividad para casa', 'body' => 'Busquen juntos en casa un alimento que venga de la granja (huevo, leche, queso) y conversen de qué animal viene.']],
            ]);
        }
    }

    private function user(string $name, string $email, Role $role): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => 'password', 'email_verified_at' => now()],
        );
        $user->assignRole($role);

        return $user;
    }
}
