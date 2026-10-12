<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\StaffAttendance;
use App\Models\StudentAttendance;
use App\Models\User;
use App\Services\AttendanceService;
use Carbon\CarbonImmutable;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    private Classroom $patitos;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-10-13 07:40')); // martes
        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->patitos = Classroom::where('slug', 'patitos')->firstOrFail();
    }

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    public function test_teacher_and_intern_take_classroom_attendance(): void
    {
        $enrollment = Enrollment::where('classroom_id', $this->patitos->id)->firstOrFail();

        $this->actingAs($this->user('practicante@villajardin.test'))
            ->get(route('attendance.classroom', $this->patitos))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance/classroom')
                ->has('students', 1)
                ->where('students.0.pickups.0', 'Carmen Quispe (madre)'));

        $this->actingAs($this->user('maestra@villajardin.test'))
            ->post(route('attendance.classroom.store', $this->patitos), [
                'date' => '2026-10-13',
                'entries' => [['enrollment_id' => $enrollment->id, 'status' => 'presente', 'arrived_at' => '08:05']],
            ])
            ->assertRedirect();

        // Corrección del mismo día: registra la salida y quién lo recogió.
        $this->actingAs($this->user('maestra@villajardin.test'))
            ->post(route('attendance.classroom.store', $this->patitos), [
                'date' => '2026-10-13',
                'entries' => [['enrollment_id' => $enrollment->id, 'status' => 'presente', 'arrived_at' => '08:05', 'left_at' => '12:10', 'picked_up_by' => 'Carmen Quispe (madre)']],
            ])
            ->assertSessionHasNoErrors();

        $record = StudentAttendance::sole();
        $this->assertStringStartsWith('12:10', $record->left_at);
        $this->assertSame('Carmen Quispe (madre)', $record->picked_up_by);
    }

    public function test_other_staff_and_parents_cannot_take_attendance(): void
    {
        $ositos = Classroom::where('slug', 'ositos')->firstOrFail();

        $this->actingAs($this->user('maestra@villajardin.test'))->get(route('attendance.classroom', $ositos))->assertForbidden();
        $this->actingAs($this->user('padre@villajardin.test'))->get(route('attendance.classroom', $this->patitos))->assertForbidden();
    }

    public function test_cannot_record_students_from_another_classroom(): void
    {
        $this->actingAs($this->user('maestra@villajardin.test'))
            ->post(route('attendance.classroom.store', $this->patitos), [
                'date' => '2026-10-13',
                'entries' => [['enrollment_id' => 9999, 'status' => 'presente']],
            ])
            ->assertSessionHasErrors('entries.0.enrollment_id');
    }

    public function test_parent_sees_child_attendance(): void
    {
        $enrollment = Enrollment::where('classroom_id', $this->patitos->id)->firstOrFail();
        StudentAttendance::create(['enrollment_id' => $enrollment->id, 'classroom_id' => $this->patitos->id, 'date' => '2026-10-12', 'status' => 'tardanza', 'arrived_at' => '08:30']);

        $this->actingAs($this->user('padre@villajardin.test'))
            ->get(route('attendance.mine', ['mes' => '2026-10']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('children.0.records.0.status', 'tardanza')
                ->where('children.0.records.0.arrived_at', '08:30'));
    }

    public function test_staff_check_in_on_time_then_late_detection_and_checkout(): void
    {
        $teacher = $this->user('maestra@villajardin.test');

        $this->actingAs($teacher)->post(route('attendance.check-in'))->assertRedirect();
        $this->actingAs($teacher)->post(route('attendance.check-in'))->assertSessionHasErrors('attendance');
        $this->assertSame('puntual', StaffAttendance::sole()->status);

        $this->travelTo(CarbonImmutable::parse('2026-10-13 13:00'));
        $this->actingAs($teacher)->post(route('attendance.check-out'))->assertRedirect();
        $this->assertNotNull(StaffAttendance::sole()->check_out_at);

        // Al día siguiente llega 20 minutos tarde (07:45 + 5 de tolerancia).
        $this->travelTo(CarbonImmutable::parse('2026-10-14 08:05'));
        $this->actingAs($teacher)->post(route('attendance.check-in'));
        $late = StaffAttendance::whereDate('date', '2026-10-14')->sole();
        $this->assertSame('tardanza', $late->status);
        $this->assertSame(20, $late->late_minutes);
    }

    public function test_location_is_enforced_when_configured(): void
    {
        config(['school.location' => ['latitude' => -14.0678, 'longitude' => -75.7286, 'radius' => 150]]);
        $teacher = $this->user('maestra@villajardin.test');

        $this->actingAs($teacher)->post(route('attendance.check-in'))->assertSessionHasErrors('attendance');
        $this->actingAs($teacher)->post(route('attendance.check-in'), ['latitude' => -12.0464, 'longitude' => -77.0428])->assertSessionHasErrors('attendance'); // Lima
        $this->actingAs($teacher)->post(route('attendance.check-in'), ['latitude' => -14.0680, 'longitude' => -75.7287])->assertSessionHasNoErrors();
    }

    public function test_monthly_summary_counts_absences_on_business_days(): void
    {
        $teacher = $this->user('maestra@villajardin.test');
        $this->travelTo(CarbonImmutable::parse('2026-10-09 18:00')); // viernes; el 8 es feriado
        StaffAttendance::create(['user_id' => $teacher->id, 'date' => '2026-10-01', 'status' => 'puntual']);
        StaffAttendance::create(['user_id' => $teacher->id, 'date' => '2026-10-02', 'status' => 'tardanza', 'late_minutes' => 12]);
        StaffAttendance::create(['user_id' => $teacher->id, 'date' => '2026-10-05', 'status' => 'justificada']);

        $row = app(AttendanceService::class)->monthlySummary('2026-10')->firstWhere('user.id', $teacher->id);

        // Días hábiles 1, 2, 5, 6, 7, 9 (sin el feriado del 8) = 6.
        $this->assertSame(6, $row['business_days']);
        $this->assertSame(2, $row['present']);
        $this->assertSame(1, $row['late']);
        $this->assertSame(12, $row['late_minutes']);
        $this->assertSame(3, $row['absences']); // 6, 7 y 9
    }

    public function test_admin_registers_justified_absence(): void
    {
        $teacher = $this->user('maestra@villajardin.test');

        $this->actingAs($this->user('admin@villajardin.test'))
            ->post(route('admin.staff-attendance.store'), [
                'user_id' => $teacher->id,
                'date' => '2026-10-12',
                'status' => 'justificada',
                'notes' => 'Cita médica con certificado',
            ])
            ->assertRedirect();

        $this->assertSame('justificada', StaffAttendance::sole()->status);
        $this->actingAs($teacher)->get(route('admin.staff-attendance.index'))->assertForbidden();
    }
}
