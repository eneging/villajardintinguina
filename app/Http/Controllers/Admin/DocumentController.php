<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Employee;
use App\Models\Media;
use App\Models\Student;
use App\Services\CloudinaryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Repositorio de documentos (colegio, alumnos y personal) con vencimientos.
 */
class DocumentController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'owner_type' => ['nullable', 'in:institution,student,employee'],
            'expiring' => ['nullable', 'boolean'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $documents = Document::query()
            ->when($filters['owner_type'] ?? null, fn ($q, $type) => $q->where('owner_type', $type))
            ->when($filters['expiring'] ?? false, fn ($q) => $q->whereNotNull('expires_on')->where('expires_on', '<=', today()->addDays(30)))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->where('title', 'like', "%{$search}%"))
            ->orderByRaw('expires_on is null')
            ->orderBy('expires_on')
            ->latest('id')
            ->get();

        return Inertia::render('admin/documents/index', [
            'documents' => $documents->map(fn (Document $document) => DocumentPresenter::row($document)),
            'filters' => [
                'owner_type' => $filters['owner_type'] ?? '',
                'expiring' => (bool) ($filters['expiring'] ?? false),
                'search' => $filters['search'] ?? '',
            ],
            'categories' => Document::CATEGORIES,
            'students' => Student::orderBy('last_name')->get()->map(fn (Student $s) => ['value' => $s->id, 'label' => $s->fullName()]),
            'employees' => Employee::orderBy('name')->get()->map(fn (Employee $e) => ['value' => $e->id, 'label' => $e->name]),
            'cloudinaryEnabled' => app(CloudinaryService::class)->isConfigured(),
        ]);
    }

    public function store(Request $request, CloudinaryService $cloudinary): RedirectResponse
    {
        $type = $request->input('owner_type');

        $data = $request->validate([
            'owner_type' => ['required', 'in:institution,student,employee'],
            'owner_id' => [Rule::requiredIf($type !== 'institution'), 'nullable', 'integer', match ($type) {
                'student' => Rule::exists('students', 'id'),
                'employee' => Rule::exists('employees', 'id'),
                default => 'prohibited',
            }],
            'category' => ['required', Rule::in(Document::CATEGORIES[$type] ?? [])],
            'title' => ['required', 'string', 'max:150'],
            'media_id' => ['required', 'integer', 'exists:media,id'],
            'expires_on' => ['nullable', 'date'],
            'visibility' => ['required', Rule::in($type === 'institution' ? ['staff', 'families', 'all'] : ['private', 'shared'])],
        ], ['media_id.required' => 'Sube el archivo del documento.'], ['owner_id' => 'alumno o trabajador', 'category' => 'tipo', 'title' => 'título']);

        if (! $cloudinary->belongsToFolder(Media::findOrFail($data['media_id'])->public_id, 'documentos')) {
            throw ValidationException::withMessages(['media_id' => 'Archivo no válido.']);
        }

        Document::create([...$data, 'uploaded_by' => $request->user()->id]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Documento guardado.']);

        return back();
    }

    public function destroy(Document $document): RedirectResponse
    {
        $document->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Documento eliminado.']);

        return back();
    }
}
