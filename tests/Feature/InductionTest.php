<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Classroom;
use App\Models\InductionLesson;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\InductionSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InductionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class, InductionSeeder::class]);
    }

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    private function lesson(string $title): InductionLesson
    {
        return InductionLesson::where('title', $title)->firstOrFail();
    }

    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'Uso de la agenda',
            'description' => 'Cómo comunicarnos.',
            'audience' => 'parents',
            'is_required' => true,
            'status' => 'published',
            'targets' => ['general' => false, 'level_ids' => [], 'classroom_ids' => []],
            'blocks' => [['type' => 'text', 'content' => ['body' => 'Revisen la agenda cada día.']]],
            ...$overrides,
        ];
    }

    public function test_parent_sees_general_and_own_classroom_lessons(): void
    {
        $this->actingAs($this->user('padre@villajardin.test'))
            ->get(route('induction.mine'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('induction/mine')
                ->has('groups', 1)
                ->has('groups.0.lessons', 3)
                ->where('groups.0.lessons.2.title', 'Así es un día en el salón Patitos'));
    }

    public function test_parent_of_another_classroom_does_not_see_patitos_lesson(): void
    {
        $patitosLesson = $this->lesson('Así es un día en el salón Patitos');
        $other = User::factory()->create();
        $other->assignRole(Role::Parent);
        $student = Student::create(['first_name' => 'Mateo', 'last_name' => 'Ríos']);
        $student->guardians()->attach($other);
        $ositos = Classroom::where('slug', 'ositos')->firstOrFail();
        $student->enrollments()->create(['classroom_id' => $ositos->id, 'school_year_id' => $ositos->school_year_id]);

        $this->actingAs($other)->get(route('induction.show', $patitosLesson))->assertForbidden();
        $this->actingAs($other)->get(route('induction.show', $this->lesson('Protocolo de recojo')))->assertOk();
        $this->actingAs($other)->get(route('induction.show', $this->lesson('Inducción para maestras y practicantes')))->assertForbidden();
    }

    public function test_lesson_with_confirmation_requires_acceptance(): void
    {
        $parent = $this->user('padre@villajardin.test');
        $lesson = $this->lesson('Protocolo de recojo');

        $this->actingAs($parent)
            ->post(route('induction.complete', $lesson))
            ->assertSessionHasErrors('accepted');
        $this->assertDatabaseCount('induction_progress', 0);

        $this->actingAs($parent)
            ->post(route('induction.complete', $lesson), ['accepted' => true])
            ->assertRedirect(route('induction.mine'));

        $progress = $lesson->progress()->firstOrFail();
        $this->assertSame($parent->id, $progress->user_id);
        $this->assertNotNull($progress->accepted_at);
    }

    public function test_classroom_board_shows_parent_progress(): void
    {
        $parent = $this->user('padre@villajardin.test');
        $this->actingAs($parent)->post(route('induction.complete', $this->lesson('Bienvenidos a Villa Jardín')));
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();

        $this->actingAs($this->user('maestra@villajardin.test'))
            ->get(route('induction.progress', $patitos))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('induction/progress')
                ->has('lessons', 2)
                ->has('parents', 1)
                ->where('parents.0.children.0', 'Sofía Quispe')
                ->where('parents.0.completed', [$this->lesson('Bienvenidos a Villa Jardín')->id]));

        $this->actingAs($parent)->get(route('induction.progress', $patitos))->assertForbidden();
        $this->actingAs($this->user('maestra@villajardin.test'))
            ->get(route('induction.progress', Classroom::where('slug', 'ositos')->firstOrFail()))
            ->assertForbidden();
    }

    public function test_teacher_can_only_target_own_classrooms(): void
    {
        $teacher = $this->user('maestra@villajardin.test');
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $ositos = Classroom::where('slug', 'ositos')->firstOrFail();

        $this->actingAs($teacher)
            ->post(route('induction.store'), $this->payload(['targets' => ['general' => true]]))
            ->assertSessionHasErrors('targets');

        $this->actingAs($teacher)
            ->post(route('induction.store'), $this->payload(['targets' => ['classroom_ids' => [$ositos->id]]]))
            ->assertSessionHasErrors('targets');

        $this->actingAs($teacher)
            ->post(route('induction.store'), $this->payload(['audience' => 'staff', 'targets' => ['classroom_ids' => [$patitos->id]]]))
            ->assertSessionHasErrors('audience');

        $this->actingAs($teacher)
            ->post(route('induction.store'), $this->payload(['targets' => ['classroom_ids' => [$patitos->id]]]))
            ->assertRedirect();

        $lesson = $this->lesson('Uso de la agenda');
        $this->assertSame([$patitos->id], $lesson->assignments->pluck('scope_id')->all());

        // No puede editar lecciones generales de la administradora.
        $this->actingAs($teacher)
            ->put(route('induction.update', $this->lesson('Protocolo de recojo')), $this->payload(['targets' => ['classroom_ids' => [$patitos->id]]]))
            ->assertForbidden();
    }

    public function test_admin_can_target_levels_and_parents_cannot_manage(): void
    {
        $admin = $this->user('admin@villajardin.test');
        $level = Classroom::where('slug', 'leoncitos')->firstOrFail()->level_id;

        $this->actingAs($admin)
            ->post(route('induction.store'), $this->payload([
                'title' => 'Preparación para primaria',
                'targets' => ['level_ids' => [$level]],
                'blocks' => [['type' => 'confirmation', 'content' => ['body' => 'Acepto']]],
            ]))
            ->assertRedirect();

        $this->assertSame('level', $this->lesson('Preparación para primaria')->assignments->first()->scope->value);

        $this->actingAs($this->user('padre@villajardin.test'))
            ->get(route('induction.index'))
            ->assertForbidden();
    }

    public function test_confirmation_blocks_are_not_allowed_in_learning_modules(): void
    {
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();

        $this->actingAs($this->user('maestra@villajardin.test'))
            ->post(route('modules.store', $patitos), [
                'title' => 'X', 'area' => 'arte', 'starts_on' => now()->toDateString(), 'ends_on' => now()->toDateString(),
                'status' => 'draft',
                'blocks' => [['type' => 'confirmation', 'content' => ['body' => 'Acepto']]],
            ])
            ->assertSessionHasErrors('blocks.0.type');
    }
}
