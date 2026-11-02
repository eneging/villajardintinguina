<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class StudentImportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
    }

    private function row(array $overrides = []): array
    {
        return [
            'alumno_nombres' => 'Mateo', 'alumno_apellidos' => 'Torres Díaz', 'alumno_dni' => '90000021',
            'fecha_nacimiento' => '15/03/2023', 'sexo' => 'm', 'salon' => 'patitos', 'mensualidad' => 'S/ 350',
            'alergias' => '', 'autoriza_imagen' => 'Sí',
            'apoderado_nombre' => 'Lucía Díaz', 'apoderado_dni' => '41234567', 'apoderado_celular' => '987654321',
            'apoderado_correo' => 'Lucia.Diaz@Gmail.com', 'parentesco' => 'Madre',
            ...$overrides,
        ];
    }

    public function test_analysis_reports_errors_per_row_without_saving(): void
    {
        $response = $this->actingAs($this->admin)->postJson(route('admin.students.import.analyze'), ['rows' => [
            $this->row(),
            $this->row(['alumno_dni' => '90000021', 'alumno_nombres' => 'Otro', 'salon' => 'Jirafitas', 'apoderado_correo' => '', 'fecha_nacimiento' => '31/02/2023', 'sexo' => 'X']),
        ]])->assertOk();

        $results = $response->json('results');
        $this->assertSame([], $results[0]['errors']);
        $this->assertSame('Patitos', $results[0]['classroom']);
        $this->assertSame(3, $results[1]['row']);
        $errors = implode(' ', $results[1]['errors']);
        $this->assertStringContainsString('se repite', $errors);
        $this->assertStringContainsString('Jirafitas', $errors);
        $this->assertStringContainsString('correo', $errors);
        $this->assertStringContainsString('Fecha', $errors);
        $this->assertStringContainsString('Sexo', $errors);

        $this->assertNull(Student::where('dni', '90000021')->first());

        // Con errores no se importa nada.
        $this->actingAs($this->admin)->postJson(route('admin.students.import.store'), ['rows' => [$this->row(), $this->row(['salon' => 'Jirafitas', 'alumno_dni' => '90000022'])]])->assertStatus(422);
        $this->assertNull(Student::where('dni', '90000021')->first());
    }

    public function test_import_creates_students_parents_and_enrollments_and_reuses_existing_parents(): void
    {
        Notification::fake();
        $existingParent = User::where('email', 'padre@villajardin.test')->firstOrFail();

        $this->actingAs($this->admin)->postJson(route('admin.students.import.store'), ['send_access' => true, 'rows' => [
            $this->row(),
            $this->row([
                'alumno_nombres' => 'Valeria', 'alumno_dni' => '', 'fecha_nacimiento' => '2022-08-01', 'sexo' => 'F', 'salon' => '', 'mensualidad' => '',
                'apoderado_nombre' => 'Carmen Quispe', 'apoderado_correo' => 'padre@villajardin.test', 'apoderado_dni' => '',
            ]),
        ]])->assertOk()->assertJson(['students' => 2, 'parents' => 1, 'invited' => 1]);

        $mateo = Student::where('dni', '90000021')->sole();
        $this->assertSame('M', $mateo->sex);
        $this->assertTrue($mateo->image_consent);
        $this->assertSame('Patitos', $mateo->currentEnrollment->classroom->name);
        $this->assertEquals(350, $mateo->currentEnrollment->monthly_fee);

        $lucia = User::where('email', 'lucia.diaz@gmail.com')->sole();
        $this->assertTrue($lucia->hasRole(Role::Parent));
        $this->assertTrue((bool) $mateo->guardians()->whereKey($lucia->id)->first()->pivot->is_billing_contact);
        Notification::assertSentTo($lucia, ResetPassword::class);

        $valeria = Student::where('first_name', 'Valeria')->sole();
        $this->assertTrue($valeria->guardians()->whereKey($existingParent->id)->exists());
        $this->assertNull($valeria->currentEnrollment);

        // Volver a importar el mismo archivo actualiza, no duplica.
        $this->actingAs($this->admin)->postJson(route('admin.students.import.store'), ['rows' => [$this->row(['alergias' => 'Maní'])]])->assertOk()->assertJson(['students' => 0, 'parents' => 0]);
        $this->assertSame('Maní', $mateo->fresh()->allergies);
        $this->assertSame(1, Student::where('dni', '90000021')->count());

        $this->actingAs($this->admin)->get(route('admin.students.import.template'))->assertOk();
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $this->actingAs($teacher)->postJson(route('admin.students.import.analyze'), ['rows' => [$this->row()]])->assertForbidden();
    }
}
