<?php

namespace Tests\Feature;

use App\Enums\ClassroomStaffRole;
use App\Enums\ModuleStatus;
use App\Enums\Role;
use App\Models\Classroom;
use App\Models\LearningModule;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LearningModuleTest extends TestCase
{
    use RefreshDatabase;

    private Classroom $patitos;

    private Classroom $ositos;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $this->ositos = Classroom::where('slug', 'ositos')->firstOrFail();
    }

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    private function validPayload(array $overrides = []): array
    {
        return [
            'title' => 'Los colores primarios',
            'area' => 'arte',
            'summary' => 'Mezclaremos pinturas.',
            'goals' => ['Reconoce rojo, azul y amarillo', ''],
            'starts_on' => now()->toDateString(),
            'ends_on' => now()->addWeek()->toDateString(),
            'status' => 'published',
            'blocks' => [
                ['type' => 'text', 'content' => ['body' => 'Hola familias']],
                ['type' => 'video', 'content' => ['youtube_url' => 'https://www.youtube.com/watch?v=abcdefghijk']],
                ['type' => 'activity', 'content' => ['title' => 'En casa', 'body' => 'Busquen algo rojo']],
            ],
            ...$overrides,
        ];
    }

    public function test_parent_sees_published_modules_of_their_childs_classroom(): void
    {
        $parent = $this->user('padre@villajardin.test');
        $module = $this->patitos->learningModules()->firstOrFail();

        $this->actingAs($parent)
            ->get(route('classrooms.show', $this->patitos))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('classrooms/show')
                ->where('canManage', false)
                ->has('modules', 1)
                ->where('children.0.name', 'Sofía Quispe'));

        $this->actingAs($parent)->get(route('modules.show', $module))->assertOk();
    }

    public function test_parent_cannot_see_drafts_or_other_classrooms(): void
    {
        $parent = $this->user('padre@villajardin.test');
        $teacher = $this->user('maestra@villajardin.test');

        $draft = $this->patitos->learningModules()->create([
            ...$this->validPayload(['status' => ModuleStatus::Draft]),
            'author_id' => $teacher->id,
        ]);
        $other = $this->ositos->learningModules()->create([
            ...$this->validPayload(),
            'author_id' => $teacher->id,
        ]);

        $this->actingAs($parent)->get(route('modules.show', $draft))->assertForbidden();
        $this->actingAs($parent)->get(route('modules.show', $other))->assertForbidden();
        $this->actingAs($parent)->get(route('classrooms.show', $this->ositos))->assertForbidden();
        $this->actingAs($parent)
            ->get(route('classrooms.show', $this->patitos))
            ->assertInertia(fn (Assert $page) => $page->has('modules', 1));
    }

    public function test_teacher_can_create_module_in_assigned_classroom(): void
    {
        $teacher = $this->user('maestra@villajardin.test');

        $response = $this->actingAs($teacher)
            ->post(route('modules.store', $this->patitos), $this->validPayload());

        $module = LearningModule::where('title', 'Los colores primarios')->firstOrFail();
        $response->assertRedirect(route('modules.show', $module));

        $this->assertSame(['Reconoce rojo, azul y amarillo'], $module->goals);
        $this->assertTrue($module->isPublished());
        $this->assertNotNull($module->published_at);
        $this->assertSame(['text', 'video', 'activity'], $module->blocks->pluck('type.value')->all());
    }

    public function test_teacher_cannot_manage_other_classrooms(): void
    {
        $teacher = $this->user('maestra@villajardin.test');

        $this->actingAs($teacher)
            ->post(route('modules.store', $this->ositos), $this->validPayload())
            ->assertForbidden();
    }

    public function test_intern_and_parent_cannot_create_modules(): void
    {
        foreach (['practicante@villajardin.test', 'padre@villajardin.test'] as $email) {
            $this->actingAs($this->user($email))
                ->post(route('modules.store', $this->patitos), $this->validPayload())
                ->assertForbidden();
        }

        $this->actingAs($this->user('practicante@villajardin.test'))
            ->get(route('classrooms.index'))
            ->assertForbidden();
    }

    public function test_admin_can_edit_any_module_and_unpublish_it(): void
    {
        $admin = $this->user('admin@villajardin.test');
        $module = $this->patitos->learningModules()->firstOrFail();

        $this->actingAs($admin)
            ->put(route('modules.update', $module), $this->validPayload(['status' => 'draft', 'blocks' => []]))
            ->assertRedirect(route('modules.show', $module));

        $module->refresh();
        $this->assertSame(ModuleStatus::Draft, $module->status);
        $this->assertNull($module->published_at);
        $this->assertCount(0, $module->blocks);
    }

    public function test_blocks_are_validated_by_type(): void
    {
        $teacher = $this->user('maestra@villajardin.test');

        $this->actingAs($teacher)
            ->post(route('modules.store', $this->patitos), $this->validPayload([
                'blocks' => [
                    ['type' => 'text', 'content' => []],
                    ['type' => 'image', 'content' => []],
                    ['type' => 'video', 'content' => ['youtube_url' => 'https://evil.example.com/video']],
                ],
            ]))
            ->assertSessionHasErrors(['blocks.0', 'blocks.1', 'blocks.2.content.youtube_url']);
    }

    public function test_new_teacher_assignment_grants_access(): void
    {
        $newTeacher = User::factory()->create();
        $newTeacher->assignRole(Role::Teacher);

        $this->actingAs($newTeacher)->get(route('modules.create', $this->ositos))->assertForbidden();

        $this->ositos->staff()->attach($newTeacher, ['role' => ClassroomStaffRole::Lead->value]);

        $this->actingAs($newTeacher)->get(route('modules.create', $this->ositos))->assertOk();
    }
}
