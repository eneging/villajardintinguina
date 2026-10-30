<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\GradingPeriod;
use App\Models\ReportCard;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportCardTest extends TestCase
{
    use RefreshDatabase;

    public function test_period_grading_publication_and_parent_access(): void
    {
        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $sofia = Student::where('dni', '90000001')->firstOrFail();

        $this->actingAs($admin)->post(route('admin.settings.periods.store'), [
            'name' => 'I Trimestre', 'starts_on' => now()->subMonth()->toDateString(), 'ends_on' => now()->addMonth()->toDateString(),
        ])->assertSessionHasNoErrors();
        $period = GradingPeriod::sole();
        $this->assertSame(SchoolYear::current()->id, $period->school_year_id);

        $this->actingAs($teacher)->get(route('report-cards.classroom', $patitos))
            ->assertInertia(fn (Assert $page) => $page->where('period.id', $period->id)->where('students.0.graded', 0));

        $this->actingAs($teacher)->put(route('report-cards.save', [$patitos, $period, $sofia]), [
            'grades' => ['identidad' => ['grade' => 'X']],
        ])->assertSessionHasErrors('grades.identidad.grade');

        $this->actingAs($teacher)->put(route('report-cards.save', [$patitos, $period, $sofia]), [
            'grades' => [
                'identidad' => ['grade' => 'A'],
                'oral' => ['grade' => 'B', 'conclusion' => 'Expresa sus ideas con apoyo.'],
                'inventada' => ['grade' => 'AD'],
            ],
            'comment' => 'Muy participativa.',
        ])->assertSessionHasNoErrors();

        $card = ReportCard::sole();
        $this->assertSame(2, $card->gradedCount());
        $this->assertArrayNotHasKey('inventada', $card->grades);

        // Antes de publicar, la familia no ve la libreta.
        $this->actingAs($parent)->get(route('report-cards.show', [$sofia, $period]))->assertForbidden();
        $this->actingAs($parent)->get(route('report-cards.mine'))->assertInertia(fn (Assert $page) => $page->has('children.0.cards', 0));

        $this->actingAs($admin)->post(route('admin.settings.periods.publish', $period), ['published' => true])->assertRedirect();
        $this->assertSame(1, $parent->notifications()->where('data->kind', 'report')->count());

        $this->actingAs($parent)->get(route('report-cards.show', [$sofia, $period]))->assertInertia(fn (Assert $page) => $page
            ->component('report-cards/show')
            ->where('grades.oral.grade', 'B')
            ->where('classroom.teacher', 'Miss Rosa'));

        // No se elimina un periodo con libretas.
        $this->actingAs($admin)->delete(route('admin.settings.periods.destroy', $period))->assertStatus(422);

        $stranger = User::factory()->create();
        $this->actingAs($stranger)->get(route('report-cards.show', [$sofia, $period]))->assertForbidden();
    }
}
