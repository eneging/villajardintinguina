<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\DocumentPresenter;
use App\Models\Document;
use App\Services\CloudinaryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Documentos visibles para cada persona y apertura con enlace temporal.
 */
class DocumentController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('documents/index', [
            'documents' => Document::query()
                ->visibleTo($request->user())
                ->orderBy('owner_type')
                ->orderBy('title')
                ->get()
                ->map(fn (Document $document) => DocumentPresenter::row($document)),
        ]);
    }

    /**
     * Abre el archivo: solo tras verificar permisos y con un enlace que vence en minutos.
     */
    public function open(Request $request, Document $document, CloudinaryService $cloudinary): RedirectResponse
    {
        abort_unless(Document::query()->visibleTo($request->user())->whereKey($document->id)->exists(), 403);

        return redirect()->away($cloudinary->temporaryDownloadUrl($document->media));
    }
}
