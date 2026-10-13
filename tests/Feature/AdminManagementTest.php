<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Classroom;
use App\Models\Lead;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
    }

    public function test_only_admin_reaches_management_screens(): void
    {
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();

        foreach (['admin.users.index', 'admin.students.index', 'admin.classrooms.create'] as $route) {
            $this->actingAs($teacher)->get(route($route))->assertForbidden();
            $this->actingAs($this->admin)->get(route($route))->assertOk();
        }
    }

    public function test_admin_creates_parent_and_access_link_is_sent(): void
    {
        Notification::fake();

        $this->actingAs($this->admin)
            ->post(route('admin.users.store'), [
                'name' => 'Luis Ramos',
                'email' => 'luis@example.com',
                'dni' => '41234567',
                'phone' => '912345678',
                'active' => true,
                'roles' => ['parent'],
            ])
            ->assertRedirect(route('admin.users.index'));

        $user = User::where('email', 'luis@example.com')->firstOrFail();
        $this->assertTrue($user->hasRole(Role::Parent));
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_inactive_users_cannot_log_in(): void
    {
        $parent = User::where('email', 'padre@villajardin.test')->firstOrFail();

        $this->actingAs($this->admin)
            ->put(route('admin.users.update', $parent), [
                'name' => $parent->name,
                'email' => $parent->email,
                'active' => false,
                'roles' => ['parent'],
            ])
            ->assertRedirect();

        auth()->logout();
        $this->post(route('login.store'), ['email' => 'padre@villajardin.test', 'password' => 'password']);
        $this->assertGuest();
    }

    public function test_admin_cannot_remove_own_admin_role(): void
    {
        $this->actingAs($this->admin)
            ->put(route('admin.users.update', $this->admin), [
                'name' => $this->admin->name,
                'email' => $this->admin->email,
                'active' => true,
                'roles' => ['teacher'],
            ])
            ->assertStatus(422);

        $this->assertTrue($this->admin->fresh()->hasRole(Role::Admin));
    }

    public function test_admin_registers_student_with_guardian_and_enrollment(): void
    {
        $parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
        $ositos = Classroom::where('slug', 'ositos')->firstOrFail();

        $this->actingAs($this->admin)
            ->post(route('admin.students.store'), [
                'first_name' => 'Mateo',
                'last_name' => 'Quispe',
                'dni' => '90000002',
                'birth_date' => now()->subYears(4)->toDateString(),
                'sex' => 'M',
                'image_consent' => true,
                'guardians' => [['user_id' => $parent->id, 'relationship' => 'madre', 'is_billing_contact' => true, 'can_pick_up' => true]],
                'enrollment' => ['classroom_id' => $ositos->id, 'monthly_fee' => 380, 'discount_pct' => 10, 'status' => 'active'],
            ])
            ->assertRedirect(route('admin.students.index'));

        $student = Student::where('dni', '90000002')->firstOrFail();
        $this->assertSame($ositos->id, $student->currentEnrollment->classroom_id);
        $this->assertEquals(10, $student->currentEnrollment->discount_pct);

        // La madre ahora ve ambos salones en su inicio.
        $this->actingAs($parent)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->has('children', 2));
    }

    public function test_guardian_must_have_parent_role(): void
    {
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();

        $this->actingAs($this->admin)
            ->post(route('admin.students.store'), [
                'first_name' => 'Ana',
                'last_name' => 'Pérez',
                'guardians' => [['user_id' => $teacher->id, 'relationship' => 'madre']],
            ])
            ->assertSessionHasErrors('guardians.0.user_id');
    }

    public function test_admin_creates_classroom_and_assigns_teacher(): void
    {
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $level = Classroom::where('slug', 'ositos')->firstOrFail()->level_id;

        $this->actingAs($this->admin)
            ->post(route('admin.classrooms.store'), [
                'name' => 'Ositos B',
                'level_id' => $level,
                'shift' => 'tarde',
                'capacity' => 18,
                'color' => '#22c55e',
                'mascot' => '🐼',
                'staff' => [['user_id' => $teacher->id, 'role' => 'titular']],
            ])
            ->assertRedirect();

        $classroom = Classroom::where('name', 'Ositos B')->firstOrFail();
        $this->assertSame('ositos-b', $classroom->slug);
        $this->assertTrue($classroom->hasStaffMember($teacher));

        // La maestra ya puede publicar módulos en su nuevo salón.
        $this->actingAs($teacher)->get(route('modules.create', $classroom))->assertOk();
    }

    public function test_admin_exports_students_debtors_and_leads_to_csv(): void
    {
        $admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
        Lead::create(['parent_name' => '=HYPERLINK("x")', 'phone' => '987654321']);

        $students = $this->actingAs($admin)->get(route('admin.students.download'))->assertOk()->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBFApellidos;Nombres", $students);
        $this->assertStringContainsString('Quispe;Sofía;90000001', $students);
        $this->assertStringContainsString('Rosa Huamán (Abuela, DNI 21456789)', $students);

        $this->actingAs($admin)->get(route('admin.billing.debtors.download'))->assertOk();

        $leads = $this->actingAs($admin)->get(route('admin.leads.download'))->assertOk()->streamedContent();
        $this->assertStringContainsString("'=HYPERLINK", $leads);

        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $this->actingAs($teacher)->get(route('admin.students.download'))->assertForbidden();
    }
}
