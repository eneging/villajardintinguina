<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Classroom;
use App\Models\Document;
use App\Models\EnrollmentRequest;
use App\Models\Media;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\User;
use App\Services\CloudinaryService;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnlineEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    private User $parent;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->app->instance(CloudinaryService::class, new CloudinaryService('demo', 'key', 'secret', 'vj'));
        $this->parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
    }

    private function payload(array $overrides = []): array
    {
        $doc = Media::create(['public_id' => "vj/matriculas/padres/{$this->parent->id}/".uniqid(), 'resource_type' => 'image', 'delivery_type' => 'authenticated', 'format' => 'jpg']);

        return array_replace_recursive([
            'school_year_id' => SchoolYear::current()->id,
            'child' => ['first_name' => 'Mateo', 'last_name' => 'Quispe', 'dni' => '90000002', 'birth_date' => now()->subYears(3)->toDateString(), 'sex' => 'M', 'allergies' => 'Maní', 'blood_type' => 'O+'],
            'relationship' => 'madre',
            'emergency_contact' => ['name' => 'Rosa Huamán', 'phone' => '956111222'],
            'pickups' => [['name' => 'Juan Quispe', 'dni' => '40404040', 'relationship' => 'Tío']],
            'documents' => [['type' => 'dni', 'media_id' => $doc->id]],
            'image_consent' => true,
            'rules_accepted' => true,
        ], $overrides);
    }

    public function test_parent_submits_admin_observes_parent_corrects_and_admin_approves(): void
    {
        $this->actingAs($this->parent)->post(route('enrollment.store'), $this->payload(['rules_accepted' => false]))
            ->assertSessionHasErrors('rules_accepted');

        $this->actingAs($this->parent)->post(route('enrollment.store'), $this->payload())->assertRedirect(route('enrollment.index'));
        $request = EnrollmentRequest::sole();
        $this->assertSame(1, $this->admin->notifications()->count());

        $this->actingAs($this->admin)->post(route('admin.enrollments.observe', $request), ['status' => 'observada', 'admin_notes' => 'Falta el carné de vacunas.'])->assertRedirect();
        $this->assertSame('observada', $request->fresh()->status);

        $this->actingAs($this->parent)->put(route('enrollment.update', $request), $this->payload(['child' => ['first_name' => 'Mateo Alonso']]))->assertRedirect();
        $this->assertSame('enviada', $request->fresh()->status);

        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $this->actingAs($this->admin)->post(route('admin.enrollments.approve', $request), ['classroom_id' => $patitos->id, 'monthly_fee' => 350])->assertRedirect();

        $student = Student::where('dni', '90000002')->sole();
        $this->assertSame('Mateo Alonso', $student->first_name);
        $this->assertStringContainsString('Grupo sanguíneo: O+', $student->medical_notes);
        $this->assertTrue($student->guardians()->whereKey($this->parent->id)->exists());
        $this->assertSame($patitos->id, $student->currentEnrollment->classroom_id);
        $this->assertSame(1, $student->authorizedPickups()->count());
        $this->assertSame(1, Document::where('owner_type', 'student')->where('owner_id', $student->id)->count());
        $this->assertSame('aprobada', $request->fresh()->status);

        // Una solicitud aprobada ya no se edita.
        $this->actingAs($this->parent)->put(route('enrollment.update', $request), $this->payload())->assertForbidden();
    }

    public function test_documents_must_come_from_the_parent_folder_and_other_parents_cannot_edit(): void
    {
        $foreign = Media::create(['public_id' => 'vj/matriculas/padres/999/dni', 'resource_type' => 'image', 'delivery_type' => 'authenticated']);

        $this->actingAs($this->parent)->post(route('enrollment.store'), $this->payload(['documents' => [['type' => 'dni', 'media_id' => $foreign->id]]]))
            ->assertSessionHasErrors('documents');

        $this->actingAs($this->parent)->post(route('enrollment.store'), $this->payload());
        $request = EnrollmentRequest::sole();

        $other = User::factory()->create();
        $other->assignRole(Role::Parent);
        $this->actingAs($other)->get(route('enrollment.edit', $request))->assertForbidden();
        $this->actingAs($this->parent)->get(route('admin.enrollments.index'))->assertForbidden();
    }

    public function test_re_enrollment_updates_existing_student_and_rejects_duplicate_dni(): void
    {
        $sofia = Student::where('dni', '90000001')->firstOrFail();
        $next = SchoolYear::create(['year' => SchoolYear::current()->year + 1, 'starts_on' => now()->addYear()->startOfYear(), 'ends_on' => now()->addYear()->endOfYear()]);
        $classroom = $next->classrooms()->create(['level_id' => $sofia->currentEnrollment->classroom->level_id, 'name' => 'Ositos', 'slug' => 'ositos']);

        $this->actingAs($this->parent)->get(route('enrollment.create', ['alumno' => $sofia->id]))->assertOk();

        $this->actingAs($this->parent)->post(route('enrollment.store'), $this->payload([
            'student_id' => $sofia->id,
            'school_year_id' => $next->id,
            'child' => ['first_name' => 'Sofía', 'last_name' => 'Quispe', 'dni' => '90000001'],
        ]))->assertSessionHasNoErrors();

        $this->actingAs($this->admin)->post(route('admin.enrollments.approve', EnrollmentRequest::sole()), ['classroom_id' => $classroom->id, 'monthly_fee' => 380])->assertRedirect();

        $this->assertSame(1, Student::where('dni', '90000001')->count());
        $this->assertTrue($sofia->enrollments()->where('school_year_id', $next->id)->exists());

        // Un alumno nuevo con el DNI de otro existente no se aprueba.
        $this->actingAs($this->parent)->post(route('enrollment.store'), $this->payload(['child' => ['dni' => '90000001']]));
        $duplicate = EnrollmentRequest::latest('id')->first();
        $this->actingAs($this->admin)->post(route('admin.enrollments.approve', $duplicate), ['classroom_id' => $classroom->id, 'monthly_fee' => 380])
            ->assertSessionHasErrors('classroom_id');
    }
}
