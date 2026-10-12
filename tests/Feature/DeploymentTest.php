<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Classroom;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class DeploymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_install_creates_structure_and_first_admin_once(): void
    {
        Notification::fake();
        config(['school.install.admin_email' => 'directora@villajardin.edu.pe', 'school.install.admin_name' => 'Directora']);

        $this->artisan('escuela:instalar')->assertSuccessful();
        $this->artisan('escuela:instalar')->assertSuccessful();

        $admin = User::where('email', 'directora@villajardin.edu.pe')->sole();
        $this->assertTrue($admin->hasRole(Role::Admin));
        Notification::assertSentToTimes($admin, ResetPassword::class, 1);
        $this->assertSame(4, Classroom::count());
        $this->assertGreaterThan(0, ExpenseCategory::count());
        $this->assertSame(1, User::count());
    }

    public function test_deploy_endpoint_requires_configured_token(): void
    {
        $this->postJson('/_deploy')->assertNotFound();

        config(['app.deploy_token' => 'secreto-largo']);
        $this->postJson('/_deploy', [], ['X-Deploy-Token' => 'otro'])->assertNotFound();

        Artisan::shouldReceive('call')->times(6)->andReturn(0);
        Artisan::shouldReceive('output')->times(6)->andReturn('ok');

        $this->postJson('/_deploy', [], ['X-Deploy-Token' => 'secreto-largo'])
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('steps.0.command', 'migrate');
    }
}
