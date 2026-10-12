<?php

namespace Tests\Feature;

use App\Enums\InductionScope;
use App\Models\Classroom;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\InductionAssignment;
use App\Models\InductionLesson;
use App\Models\Level;
use App\Models\SchoolYear;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
    }

    public function test_new_year_copies_classrooms_staff_and_classroom_inductions(): void
    {
        $current = SchoolYear::current();
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $lesson = InductionLesson::create(['title' => 'Bienvenidos Patitos', 'audience' => 'parents', 'status' => 'published']);
        $lesson->assignments()->create(['scope' => InductionScope::Classroom, 'scope_id' => $patitos->id]);

        $this->actingAs($this->admin)->get(route('admin.settings.index'))->assertOk();

        $this->actingAs($this->admin)->post(route('admin.settings.years.store'), [
            'year' => $current->year + 1,
            'starts_on' => ($current->year + 1).'-03-01',
            'ends_on' => ($current->year + 1).'-12-20',
            'copy_classrooms' => true,
            'copy_staff' => true,
        ])->assertSessionHasNoErrors();

        $next = SchoolYear::where('year', $current->year + 1)->sole();
        $this->assertFalse($next->is_active);
        $this->assertSame($current->classrooms()->count(), $next->classrooms()->count());

        $newPatitos = $next->classrooms()->where('slug', 'patitos')->sole();
        $this->assertTrue($newPatitos->staff()->exists());
        $this->assertTrue(InductionAssignment::where('scope', InductionScope::Classroom)->where('scope_id', $newPatitos->id)->exists());

        $this->actingAs($this->admin)->post(route('admin.settings.years.activate', $next))->assertRedirect();
        $this->assertSame($next->id, SchoolYear::current()->id);
        $this->assertSame(1, SchoolYear::where('is_active', true)->count());
    }

    public function test_levels_and_categories_cannot_be_deleted_while_in_use(): void
    {
        $level = Level::first();
        $this->actingAs($this->admin)->delete(route('admin.settings.levels.destroy', $level))->assertSessionHasErrors('level');

        $this->actingAs($this->admin)->post(route('admin.settings.levels.store'), ['name' => 'Talleres', 'min_age_months' => 24, 'max_age_months' => 12])
            ->assertSessionHasErrors('max_age_months');
        $this->actingAs($this->admin)->post(route('admin.settings.levels.store'), ['name' => 'Talleres', 'min_age_months' => 24, 'max_age_months' => 72])
            ->assertSessionHasNoErrors();

        $category = ExpenseCategory::first();
        Expense::create(['expense_category_id' => $category->id, 'date' => today(), 'description' => 'Luz', 'amount' => 100]);
        $this->actingAs($this->admin)->delete(route('admin.settings.categories.destroy', $category))->assertSessionHasErrors('category');

        $this->actingAs($this->admin)->post(route('admin.settings.categories.store'), ['name' => $category->name])->assertSessionHasErrors('name');
    }

    public function test_settings_are_admin_only(): void
    {
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $this->actingAs($teacher)->get(route('admin.settings.index'))->assertForbidden();
    }
}
