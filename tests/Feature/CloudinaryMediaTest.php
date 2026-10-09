<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\Media;
use App\Models\User;
use App\Services\CloudinaryService;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CloudinaryMediaTest extends TestCase
{
    use RefreshDatabase;

    private CloudinaryService $cloudinary;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->cloudinary = new CloudinaryService('demo-cloud', 'key123', 'secret456', 'villajardin/test');
        $this->app->instance(CloudinaryService::class, $this->cloudinary);
    }

    public function test_signature_matches_cloudinary_algorithm(): void
    {
        // Ejemplo de la documentación de Cloudinary.
        $service = new CloudinaryService('demo', 'key', 'abcd', 'x');

        $this->assertSame(
            sha1('eager=w_400,h_300,c_pad|w_260,h_200,c_crop&public_id=sample_image&timestamp=1315060510abcd'),
            $service->sign(['timestamp' => 1315060510, 'public_id' => 'sample_image', 'eager' => 'w_400,h_300,c_pad|w_260,h_200,c_crop']),
        );
    }

    public function test_teacher_gets_signature_scoped_to_their_classroom(): void
    {
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $ositos = Classroom::where('slug', 'ositos')->firstOrFail();

        $this->actingAs($teacher)
            ->postJson(route('media.signature'), ['classroom_id' => $patitos->id, 'resource_type' => 'image'])
            ->assertOk()
            ->assertJson([
                'folder' => "villajardin/test/salones/{$patitos->id}",
                'type' => 'authenticated',
                'api_key' => 'key123',
                'upload_url' => 'https://api.cloudinary.com/v1_1/demo-cloud/image/upload',
            ]);

        $this->actingAs($teacher)
            ->postJson(route('media.signature'), ['classroom_id' => $ositos->id, 'resource_type' => 'image'])
            ->assertForbidden();

        $parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
        $this->actingAs($parent)
            ->postJson(route('media.signature'), ['classroom_id' => $patitos->id, 'resource_type' => 'image'])
            ->assertForbidden();
    }

    public function test_upload_is_registered_only_with_valid_cloudinary_signature(): void
    {
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $publicId = "villajardin/test/salones/{$patitos->id}/granja";
        $payload = [
            'classroom_id' => $patitos->id,
            'public_id' => $publicId,
            'version' => 1700000000,
            'resource_type' => 'image',
            'type' => 'authenticated',
            'format' => 'jpg',
        ];

        $this->actingAs($teacher)
            ->postJson(route('media.store'), [...$payload, 'signature' => 'forged'])
            ->assertStatus(422);

        $signature = $this->cloudinary->sign(['public_id' => $publicId, 'version' => 1700000000]);

        $this->actingAs($teacher)
            ->postJson(route('media.store'), [...$payload, 'signature' => $signature])
            ->assertCreated()
            ->assertJsonPath('resource_type', 'image');

        $media = Media::firstOrFail();
        $this->assertMatchesRegularExpression(
            '#^https://res\.cloudinary\.com/demo-cloud/image/authenticated/s--[\w-]{8}--/f_auto,q_auto,w_1600,c_limit/v1700000000/villajardin/test/salones/\d+/granja\.jpg$#',
            $media->url('f_auto,q_auto,w_1600,c_limit'),
        );
    }

    public function test_upload_outside_classroom_folder_is_rejected(): void
    {
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $publicId = 'villajardin/test/salones/999/otra';

        $this->actingAs($teacher)
            ->postJson(route('media.store'), [
                'classroom_id' => $patitos->id,
                'public_id' => $publicId,
                'version' => 1,
                'resource_type' => 'image',
                'type' => 'authenticated',
                'signature' => $this->cloudinary->sign(['public_id' => $publicId, 'version' => 1]),
            ])
            ->assertStatus(422);
    }
}
