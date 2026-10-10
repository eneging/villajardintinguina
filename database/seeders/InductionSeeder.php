<?php

namespace Database\Seeders;

use App\Enums\InductionAudience;
use App\Enums\InductionScope;
use App\Enums\ModuleStatus;
use App\Models\Classroom;
use App\Models\InductionLesson;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Lecciones de inducción de ejemplo (solo desarrollo).
 */
class InductionSeeder extends Seeder
{
    public function run(): void
    {
        if (InductionLesson::query()->exists()) {
            return;
        }

        $admin = User::where('email', 'admin@villajardin.test')->first();
        $teacher = User::where('email', 'maestra@villajardin.test')->first();
        $patitos = Classroom::where('slug', 'patitos')->first();

        $this->lesson($admin, 'Bienvenidos a Villa Jardín', InductionAudience::Parents, true, 0, [InductionScope::General->value => [null]], [
            ['type' => 'text', 'content' => ['body' => "¡Qué alegría tenerlos con nosotros!\n\nEn esta inducción conocerán cómo trabajamos, nuestros horarios y las normas que nos ayudan a cuidar a sus hijos."]],
            ['type' => 'video', 'content' => ['caption' => 'Recorrido por el colegio', 'youtube_url' => 'https://www.youtube.com/watch?v=zXEq-QO3xTg']],
        ]);

        $this->lesson($admin, 'Protocolo de recojo', InductionAudience::Parents, true, 1, [InductionScope::General->value => [null]], [
            ['type' => 'text', 'content' => ['body' => "Solo entregamos a los niños a las personas autorizadas en su ficha. Si otra persona recogerá a su hijo, avísenos por la plataforma o por WhatsApp antes de las 11:00 a. m.\n\nLa persona debe presentar su DNI."]],
            ['type' => 'confirmation', 'content' => ['body' => 'He leído y acepto el protocolo de recojo de EP Villa Jardín.']],
        ]);

        if ($patitos && $teacher) {
            $this->lesson($teacher, 'Así es un día en el salón Patitos', InductionAudience::Parents, false, 2, [InductionScope::Classroom->value => [$patitos->id]], [
                ['type' => 'text', 'content' => ['body' => "8:00 Recepción y juego libre\n9:00 Asamblea y canción de bienvenida\n10:00 Refrigerio\n10:30 Actividad del módulo\n12:00 Salida"]],
                ['type' => 'activity', 'content' => ['title' => 'Para el primer día', 'body' => 'Traigan una muda de ropa marcada con el nombre del niño y su lonchera.']],
            ]);
        }

        $this->lesson($admin, 'Inducción para maestras y practicantes', InductionAudience::Staff, true, 0, [InductionScope::General->value => [null]], [
            ['type' => 'text', 'content' => ['body' => 'Bienvenida al equipo. Revisa el reglamento interno, el protocolo de recojo y cómo registrar la asistencia en la plataforma.']],
        ]);
    }

    /**
     * @param  array<string, list<int|null>>  $targets
     * @param  list<array<string, mixed>>  $blocks
     */
    private function lesson(?User $author, string $title, InductionAudience $audience, bool $required, int $position, array $targets, array $blocks): void
    {
        $lesson = InductionLesson::create([
            'author_id' => $author?->id,
            'title' => $title,
            'audience' => $audience,
            'is_required' => $required,
            'status' => ModuleStatus::Published,
            'position' => $position,
        ]);

        foreach ($targets as $scope => $ids) {
            foreach ($ids as $id) {
                $lesson->assignments()->create(['scope' => $scope, 'scope_id' => $id]);
            }
        }

        foreach ($blocks as $position => $block) {
            $lesson->blocks()->create([...$block, 'position' => $position]);
        }
    }
}
