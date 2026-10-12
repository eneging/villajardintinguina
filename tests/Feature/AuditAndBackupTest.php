<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Charge;
use App\Models\Payment;
use App\Models\User;
use App\Services\BillingService;
use App\Services\DatabaseBackup;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use LogicException;
use Tests\TestCase;

class AuditAndBackupTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
    }

    public function test_money_changes_are_audited_with_author_and_cannot_be_altered(): void
    {
        app(BillingService::class)->generateMonthly(now()->format('Y-m'));
        $charge = Charge::firstOrFail();

        $this->actingAs($this->admin)->post(route('admin.billing.payments.store'), [
            'charge_ids' => [$charge->id],
            'amount' => 100,
            'paid_on' => today()->toDateString(),
            'method' => 'yape',
            'operation_number' => '123456',
        ])->assertSessionHasNoErrors();

        $log = AuditLog::where('auditable_type', 'Payment')->where('event', 'created')->sole();
        $this->assertSame($this->admin->id, $log->user_id);
        $this->assertEquals(100, $log->new_values['amount']);
        $this->assertSame(Payment::sole()->id, $log->auditable_id);

        app(BillingService::class)->generateMonthly(now()->addMonth()->format('Y-m'));
        $next = Charge::whereKeyNot($charge->id)->firstOrFail();
        $this->actingAs($this->admin)->post(route('admin.billing.charges.annul', $next))->assertRedirect();
        $this->assertTrue(AuditLog::where('auditable_type', 'Charge')->where('event', 'updated')->exists());

        $this->actingAs($this->admin)->get(route('admin.audit.index', ['type' => 'Payment']))
            ->assertInertia(fn (Assert $page) => $page->component('admin/audit/index')->has('logs.data', 1));

        $this->expectException(LogicException::class);
        $log->update(['user_id' => null]);
    }

    public function test_database_backup_is_created_listed_and_downloaded_safely(): void
    {
        $dir = storage_path('framework/testing/backups');
        File::deleteDirectory($dir);
        config(['school.backups_path' => $dir, 'school.backups_keep' => 2]);

        $this->actingAs($this->admin)->post(route('admin.settings.backups.store'))->assertRedirect();

        $backups = app(DatabaseBackup::class)->list();
        $this->assertCount(1, $backups);
        $sql = gzdecode(File::get($dir.'/'.$backups[0]['name']));
        $this->assertStringContainsString('CREATE TABLE `students`', $sql);
        $this->assertStringContainsString("'Sofía'", $sql);

        $this->actingAs($this->admin)->get(route('admin.settings.backups.download', $backups[0]['name']))->assertDownload($backups[0]['name']);
        $this->actingAs($this->admin)->get(route('admin.settings.backups.download', '..%2F.env'))->assertNotFound();

        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $this->actingAs($teacher)->get(route('admin.settings.backups.download', $backups[0]['name']))->assertForbidden();

        File::deleteDirectory($dir);
    }
}
