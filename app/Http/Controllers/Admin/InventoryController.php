<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\SchoolYear;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Inventario de materiales con entradas, salidas y aviso de stock bajo.
 */
class InventoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/inventory/index', [
            'items' => InventoryItem::query()->orderBy('category')->orderBy('name')->get()->map(fn (InventoryItem $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'category' => $item->category,
                'category_label' => InventoryItem::CATEGORIES[$item->category] ?? $item->category,
                'unit' => $item->unit,
                'quantity' => (float) $item->quantity,
                'min_quantity' => (float) $item->min_quantity,
                'location' => $item->location,
                'low' => $item->isLow(),
            ]),
            'movements' => InventoryMovement::query()->with(['item', 'student', 'user'])->latest('id')->limit(40)->get()->map(fn (InventoryMovement $movement) => [
                'id' => $movement->id,
                'item' => $movement->item->name,
                'unit' => $movement->item->unit,
                'type' => $movement->type,
                'quantity' => (float) $movement->quantity,
                'reason' => $movement->reason,
                'student' => $movement->student?->fullName(),
                'user' => $movement->user?->name,
                'created_at' => $movement->created_at->toIso8601String(),
            ]),
            'categories' => EmployeeController::options(InventoryItem::CATEGORIES),
            'students' => Student::query()
                ->whereHas('enrollments', fn ($q) => $q->where('school_year_id', SchoolYear::current()?->id)->where('status', 'active'))
                ->orderBy('last_name')->get()
                ->map(fn (Student $student) => ['value' => $student->id, 'label' => $student->fullName()]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        InventoryItem::create($this->validated($request));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Material agregado al inventario.']);

        return back();
    }

    public function update(Request $request, InventoryItem $item): RedirectResponse
    {
        $item->update(collect($this->validated($request))->except('quantity')->all());

        return back();
    }

    public function move(Request $request, InventoryItem $item): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:entrada,salida'],
            'quantity' => ['required', 'numeric', 'min:0.01', 'max:99999'],
            'reason' => ['nullable', 'string', 'max:255'],
            'student_id' => ['nullable', 'integer', 'exists:students,id'],
        ], [], ['quantity' => 'cantidad']);

        DB::transaction(function () use ($item, $data, $request) {
            $item = InventoryItem::lockForUpdate()->findOrFail($item->id);
            $delta = $data['type'] === 'entrada' ? $data['quantity'] : -$data['quantity'];

            if ((float) $item->quantity + $delta < 0) {
                throw ValidationException::withMessages(['quantity' => "Solo hay {$item->quantity} {$item->unit} en stock."]);
            }

            $item->update(['quantity' => (float) $item->quantity + $delta]);
            $item->movements()->create([...$data, 'user_id' => $request->user()->id]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => $data['type'] === 'entrada' ? 'Entrada registrada.' : 'Salida registrada.']);

        return back();
    }

    public function destroy(InventoryItem $item): RedirectResponse
    {
        $item->delete();

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category' => ['required', Rule::in(array_keys(InventoryItem::CATEGORIES))],
            'unit' => ['required', 'string', 'max:20'],
            'quantity' => ['nullable', 'numeric', 'min:0', 'max:99999'],
            'min_quantity' => ['nullable', 'numeric', 'min:0', 'max:99999'],
            'location' => ['nullable', 'string', 'max:80'],
        ], [], ['name' => 'nombre', 'unit' => 'unidad']);

        return [...$data, 'quantity' => $data['quantity'] ?? 0, 'min_quantity' => $data['min_quantity'] ?? 0];
    }
}
