<?php

namespace Tests\Feature;

use App\Mail\DocumentExpirations;
use App\Models\Document;
use App\Models\Employee;
use App\Models\Media;
use App\Models\Student;
use App\Models\User;
use App\Services\CloudinaryService;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DocumentsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $parent;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->app->instance(CloudinaryService::class, new CloudinaryService('demo', 'key', 'secret', 'vj'));
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
        $this->parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
        $this->teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
    }

    private function media(string $name = 'doc'): Media
    {
        return Media::create(['public_id' => "vj/documentos/{$name}", 'resource_type' => 'image', 'delivery_type' => 'authenticated', 'format' => 'pdf']);
    }

    private function upload(array $data): void
    {
        $this->actingAs($this->admin)->post(route('admin.documents.store'), [
            'media_id' => $this->media(uniqid())->id,
            ...$data,
        ])->assertSessionHasNoErrors();
    }

    public function test_visibility_rules_per_role(): void
    {
        $sofia = Student::where('dni', '90000001')->firstOrFail();
        $other = Student::create(['first_name' => 'Otro', 'last_name' => 'Niño']);
        $employee = Employee::create(['user_id' => $this->teacher->id, 'name' => 'Miss Rosa', 'position' => 'maestra', 'regime' => 'planilla', 'base_salary' => 1800]);

        $this->upload(['owner_type' => 'institution', 'category' => 'Reglamento interno', 'title' => 'Reglamento', 'visibility' => 'all']);
        $this->upload(['owner_type' => 'institution', 'category' => 'Protocolo', 'title' => 'Protocolo docente', 'visibility' => 'staff']);
        $this->upload(['owner_type' => 'student', 'owner_id' => $sofia->id, 'category' => 'Carné de vacunas', 'title' => 'Vacunas Sofía', 'visibility' => 'shared']);
        $this->upload(['owner_type' => 'student', 'owner_id' => $sofia->id, 'category' => 'Ficha médica', 'title' => 'Ficha interna', 'visibility' => 'private']);
        $this->upload(['owner_type' => 'student', 'owner_id' => $other->id, 'category' => 'DNI', 'title' => 'DNI ajeno', 'visibility' => 'shared']);
        $this->upload(['owner_type' => 'employee', 'owner_id' => $employee->id, 'category' => 'Contrato', 'title' => 'Contrato Rosa', 'visibility' => 'shared']);

        $titles = fn (User $user) => Document::query()->visibleTo($user)->orderBy('title')->pluck('title')->all();

        $this->assertSame(['Reglamento', 'Vacunas Sofía'], $titles($this->parent));
        $this->assertSame(['Contrato Rosa', 'Protocolo docente', 'Reglamento'], $titles($this->teacher));
        $this->assertCount(6, $titles($this->admin));

        $private = Document::where('title', 'Ficha interna')->firstOrFail();
        $shared = Document::where('title', 'Vacunas Sofía')->firstOrFail();
        $this->actingAs($this->parent)->get(route('documents.open', $private))->assertForbidden();

        $location = $this->actingAs($this->parent)->get(route('documents.open', $shared))->assertRedirect()->headers->get('Location');
        $this->assertStringStartsWith('https://api.cloudinary.com/v1_1/demo/image/download?', $location);
        $this->assertStringContainsString('expires_at=', $location);
    }

    public function test_validation_of_owner_category_and_folder(): void
    {
        $outside = Media::create(['public_id' => 'vj/salones/1/foto', 'resource_type' => 'image', 'delivery_type' => 'authenticated']);

        $this->actingAs($this->admin)->post(route('admin.documents.store'), [
            'owner_type' => 'student', 'category' => 'Contrato', 'title' => 'x', 'visibility' => 'all', 'media_id' => $outside->id,
        ])->assertSessionHasErrors(['owner_id', 'category', 'visibility']);

        $this->actingAs($this->admin)->post(route('admin.documents.store'), [
            'owner_type' => 'institution', 'category' => 'PEI', 'title' => 'PEI', 'visibility' => 'all', 'media_id' => $outside->id,
        ])->assertSessionHasErrors('media_id');

        $this->actingAs($this->teacher)->get(route('admin.documents.index'))->assertForbidden();
    }

    public function test_expiration_alert_and_admin_filter(): void
    {
        Mail::fake();
        $this->upload(['owner_type' => 'institution', 'category' => 'Licencias y permisos', 'title' => 'Licencia de funcionamiento', 'visibility' => 'staff', 'expires_on' => today()->addDays(10)->toDateString()]);
        $this->upload(['owner_type' => 'institution', 'category' => 'PEI', 'title' => 'PEI', 'visibility' => 'all', 'expires_on' => today()->addYear()->toDateString()]);

        $this->actingAs($this->admin)
            ->get(route('admin.documents.index', ['expiring' => 1]))
            ->assertInertia(fn (Assert $page) => $page->has('documents', 1)->where('documents.0.expires_soon', true));

        $this->artisan('documentos:alertar-vencimientos')->assertSuccessful();
        Mail::assertSent(DocumentExpirations::class, fn ($mail) => $mail->documents->count() === 1);
    }

    public function test_admin_edits_document_metadata_within_its_owner_type(): void
    {
        $this->upload(['owner_type' => 'institution', 'category' => 'Reglamento interno', 'title' => 'Reglamento', 'visibility' => 'all']);
        $document = Document::sole();

        $this->actingAs($this->admin)->put(route('admin.documents.update', $document), ['title' => 'Reglamento 2026', 'category' => 'Carné de vacunas', 'visibility' => 'all'])
            ->assertSessionHasErrors('category');
        $this->actingAs($this->admin)->put(route('admin.documents.update', $document), ['title' => 'Reglamento 2026', 'category' => 'Reglamento interno', 'visibility' => 'families', 'expires_on' => '2026-12-31'])
            ->assertSessionHasNoErrors();

        $this->assertSame('families', $document->fresh()->visibility);
        $this->actingAs($this->parent)->put(route('admin.documents.update', $document), ['title' => 'x'])->assertForbidden();
    }
}
