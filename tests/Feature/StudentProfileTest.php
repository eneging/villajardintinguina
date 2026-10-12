<?php

namespace Tests\Feature;

use App\Models\AuthorizedPickup;
use App\Models\Classroom;
use App\Models\Media;
use App\Models\Student;
use App\Models\User;
use App\Services\CloudinaryService;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentProfileTest extends TestCase
{
    use RefreshDatabase;

    private Student $sofia;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->app->instance(CloudinaryService::class, new CloudinaryService('demo', 'key', 'secret', 'vj'));
        $this->sofia = Student::where('dni', '90000001')->firstOrFail();
    }

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    public function test_parent_sees_children_and_profile_with_billing(): void
    {
        $parent = $this->user('padre@villajardin.test');

        $this->actingAs($parent)->get(route('children.index'))->assertInertia(fn (Assert $page) => $page
            ->component('students/children')
            ->has('children', 1)
            ->where('children.0.classroom.name', 'Patitos'));

        $this->actingAs($parent)->get(route('students.show', $this->sofia))->assertInertia(fn (Assert $page) => $page
            ->component('students/show')
            ->has('pickups', 1)
            ->where('can.manage', true)
            ->whereNot('charges', null));
    }

    public function test_teacher_sees_profile_without_family_finances_and_strangers_cannot(): void
    {
        $this->actingAs($this->user('maestra@villajardin.test'))->get(route('students.show', $this->sofia))
            ->assertInertia(fn (Assert $page) => $page->where('charges', null)->where('documents', null)->where('can.manage', false));

        $stranger = User::factory()->create();
        $this->actingAs($stranger)->get(route('students.show', $this->sofia))->assertForbidden();
    }

    public function test_parent_manages_authorized_pickups_and_they_appear_in_attendance(): void
    {
        $parent = $this->user('padre@villajardin.test');

        $this->actingAs($parent)->post(route('students.pickups.store', $this->sofia), ['name' => 'Tío Juan', 'dni' => '123', 'relationship' => 'Tío'])
            ->assertSessionHasErrors('dni');

        $this->actingAs($parent)->post(route('students.pickups.store', $this->sofia), ['name' => 'Juan Quispe', 'dni' => '40404040', 'relationship' => 'Tío'])
            ->assertSessionHasNoErrors();

        $classroom = Classroom::where('slug', 'patitos')->firstOrFail();
        $this->actingAs($this->user('maestra@villajardin.test'))->get(route('attendance.classroom', $classroom))
            ->assertInertia(fn (Assert $page) => $page->where('students.0.pickups', fn ($pickups) => collect($pickups)->contains('Juan Quispe (Tío, DNI 40404040)')));

        $pickup = AuthorizedPickup::where('dni', '40404040')->sole();
        $this->actingAs($this->user('maestra@villajardin.test'))->delete(route('students.pickups.destroy', $pickup))->assertForbidden();
        $this->actingAs($parent)->delete(route('students.pickups.destroy', $pickup))->assertRedirect();
        $this->assertModelMissing($pickup);
    }

    public function test_photo_must_come_from_the_student_folder(): void
    {
        $parent = $this->user('padre@villajardin.test');
        $other = Media::create(['public_id' => 'vj/pagos/x', 'resource_type' => 'image', 'delivery_type' => 'authenticated']);
        $own = Media::create(['public_id' => "vj/alumnos/{$this->sofia->id}/foto", 'resource_type' => 'image', 'delivery_type' => 'authenticated']);

        $this->actingAs($parent)->put(route('students.photo', $this->sofia), ['media_id' => $other->id])->assertStatus(422);
        $this->actingAs($parent)->put(route('students.photo', $this->sofia), ['media_id' => $own->id])->assertRedirect();

        $this->assertSame($own->id, $this->sofia->fresh()->photo_media_id);
    }

    public function test_classroom_info_and_activities_are_managed_by_staff_and_shown_to_families(): void
    {
        $classroom = Classroom::where('slug', 'patitos')->firstOrFail();
        $teacher = $this->user('maestra@villajardin.test');
        $parent = $this->user('padre@villajardin.test');

        $this->actingAs($parent)->get(route('classrooms.info.edit', $classroom))->assertForbidden();

        $this->actingAs($teacher)->put(route('classrooms.info.update', $classroom), [
            'schedule' => [['time' => '8:00', 'activity' => 'Llegada']],
            'supplies' => [['item' => 'Témperas', 'quantity' => '6']],
            'weekly_menu' => ['lunes' => ['snack' => 'Manzana']],
        ])->assertSessionHasNoErrors();

        $this->actingAs($teacher)->post(route('classrooms.activities.store', $classroom), [
            'date' => today()->addDay()->toDateString(), 'title' => 'Día del logro', 'type' => 'celebracion',
        ])->assertSessionHasNoErrors();

        $this->actingAs($parent)->get(route('classrooms.show', $classroom))->assertInertia(fn (Assert $page) => $page
            ->where('info.schedule.0.activity', 'Llegada')
            ->where('info.weekly_menu.lunes.snack', 'Manzana')
            ->where('info.weekly_menu.martes.snack', null)
            ->where('activities', fn ($activities) => collect($activities)->contains('title', 'Día del logro')));
    }
}
