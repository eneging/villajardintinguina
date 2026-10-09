<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Media;
use App\Services\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Subida directa navegador → Cloudinary. Laravel firma la subida (decide
 * carpeta y tipo de entrega) y luego registra el archivo verificando la firma
 * que devuelve Cloudinary.
 */
class MediaController extends Controller
{
    public function __construct(private readonly CloudinaryService $cloudinary) {}

    public function signature(Request $request): JsonResponse
    {
        $data = $request->validate([
            'classroom_id' => ['required', 'integer', 'exists:classrooms,id'],
            'resource_type' => ['required', 'in:image,video,raw'],
        ]);

        $classroom = Classroom::findOrFail($data['classroom_id']);
        Gate::authorize('uploadMedia', $classroom);

        abort_unless($this->cloudinary->isConfigured(), 503, 'Cloudinary no está configurado.');

        // Contenido de salones: entrega protegida (puede contener fotos de niños).
        return response()->json(
            $this->cloudinary->signUpload("salones/{$classroom->id}", 'authenticated', $data['resource_type']),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'classroom_id' => ['required', 'integer', 'exists:classrooms,id'],
            'public_id' => ['required', 'string', 'max:255'],
            'version' => ['required', 'integer'],
            'signature' => ['required', 'string'],
            'resource_type' => ['required', 'in:image,video,raw'],
            'type' => ['required', 'in:upload,authenticated'],
            'format' => ['nullable', 'string', 'max:20'],
            'bytes' => ['nullable', 'integer'],
            'width' => ['nullable', 'integer'],
            'height' => ['nullable', 'integer'],
            'duration' => ['nullable', 'numeric'],
            'original_filename' => ['nullable', 'string', 'max:255'],
        ]);

        $classroom = Classroom::findOrFail($data['classroom_id']);
        Gate::authorize('uploadMedia', $classroom);

        abort_unless(
            $this->cloudinary->verifyUploadResponse($data['public_id'], $data['version'], $data['signature'])
                && $this->cloudinary->belongsToFolder($data['public_id'], "salones/{$classroom->id}"),
            422,
            'La subida no pudo verificarse.',
        );

        $media = Media::updateOrCreate(
            [
                'public_id' => $data['public_id'],
                'resource_type' => $data['resource_type'],
                'delivery_type' => $data['type'],
            ],
            [
                'format' => $data['format'] ?? null,
                'version' => $data['version'],
                'bytes' => $data['bytes'] ?? null,
                'width' => $data['width'] ?? null,
                'height' => $data['height'] ?? null,
                'duration' => $data['duration'] ?? null,
                'original_filename' => $data['original_filename'] ?? null,
                'status' => 'ready',
                'uploaded_by' => $request->user()->id,
            ],
        );

        return response()->json($media->toClient(), 201);
    }
}
