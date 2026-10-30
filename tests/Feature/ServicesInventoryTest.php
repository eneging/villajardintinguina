<?php

namespace Tests\Feature;

use App\Models\Charge;
use App\Models\Classroom;
use App\Models\InventoryItem;
use App\Models\Service;
use App\Models\Student;
use App\Models\User;
use App\Services\BillingService;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SchoolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ServicesInventoryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Student $sofia;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([SchoolSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('email', 'admin@villajardin.test')->firstOrFail();
        $this->sofia = Student::where('dni', '90000001')->firstOrFail();
    }

    public function test_services_are_charged_monthly_with_special_price_and_without_duplicates(): void
    {
        $this->actingAs($this->admin)->post(route('admin.services.store'), ['name' => 'Movilidad', 'monthly_price' => 120, 'active' => true])->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post(route('admin.services.store'), ['name' => 'Almuerzo', 'monthly_price' => 150, 'active' => true]);
        [$bus, $lunch] = Service::orderBy('id')->get()->all();
        $enrollment = $this->sofia->currentEnrollment;

        $this->actingAs($this->admin)->post(route('admin.services.attach', $bus), ['enrollment_id' => $enrollment->id])->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post(route('admin.services.attach', $lunch), ['enrollment_id' => $enrollment->id, 'price' => 100])->assertSessionHasNoErrors();

        $billing = app(BillingService::class);
        $this->assertSame(3, $billing->generateMonthly('2026-11')); // mensualidad + 2 servicios
        $this->assertSame(0, $billing->generateMonthly('2026-11'));

        $this->assertEquals(120, Charge::where('service_id', $bus->id)->value('amount'));
        $this->assertEquals(100, Charge::where('service_id', $lunch->id)->value('amount'));
        $this->assertSame('Movilidad Noviembre 2026', Charge::where('service_id', $bus->id)->value('description'));

        $parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
        $this->actingAs($parent)->get(route('students.show', $this->sofia))->assertInertia(fn (Assert $page) => $page->has('services', 2));

        $this->actingAs($this->admin)->delete(route('admin.services.detach', [$bus, $enrollment]))->assertRedirect();
        $this->assertSame(1, $enrollment->services()->count());
    }

    public function test_inventory_movements_update_stock_and_flag_low_items(): void
    {
        $this->actingAs($this->admin)->post(route('admin.inventory.store'), [
            'name' => 'Papel bond A4', 'category' => 'educativo', 'unit' => 'paquete', 'quantity' => 3, 'min_quantity' => 2,
        ])->assertSessionHasNoErrors();
        $item = InventoryItem::sole();

        $this->actingAs($this->admin)->post(route('admin.inventory.move', $item), ['type' => 'salida', 'quantity' => 5])->assertSessionHasErrors('quantity');
        $this->actingAs($this->admin)->post(route('admin.inventory.move', $item), ['type' => 'salida', 'quantity' => 2])->assertSessionHasNoErrors();
        $this->assertTrue($item->fresh()->isLow());

        $this->actingAs($this->admin)->post(route('admin.inventory.move', $item), ['type' => 'entrada', 'quantity' => 4, 'student_id' => $this->sofia->id])->assertSessionHasNoErrors();
        $this->assertEquals(5, $item->fresh()->quantity);
        $this->assertSame(2, $item->movements()->count());

        $this->artisan('inventario:alertar')->expectsOutputToContain('stock bajo: 0');

        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $this->actingAs($teacher)->get(route('admin.inventory.index'))->assertForbidden();
    }

    public function test_supply_checklist_tracks_deliveries_per_child(): void
    {
        $patitos = Classroom::where('slug', 'patitos')->firstOrFail();
        $teacher = User::where('email', 'maestra@villajardin.test')->firstOrFail();
        $parent = User::where('email', 'padre@villajardin.test')->firstOrFail();
        $item = $patitos->supplies[0]['item'];

        $this->actingAs($teacher)->post(route('supplies.toggle', $patitos), ['student_id' => $this->sofia->id, 'item' => $item, 'delivered' => true])->assertRedirect();
        $this->actingAs($teacher)->post(route('supplies.toggle', $patitos), ['student_id' => $this->sofia->id, 'item' => 'Inventado', 'delivered' => true])->assertSessionHasErrors('item');

        $this->actingAs($teacher)->get(route('supplies.show', $patitos))->assertInertia(fn (Assert $page) => $page->where('students.0.delivered.0', $item));
        $this->actingAs($parent)->get(route('students.show', $this->sofia))->assertInertia(fn (Assert $page) => $page
            ->has('pendingSupplies', count($patitos->supplies) - 1));
        $this->actingAs($parent)->post(route('supplies.toggle', $patitos), ['student_id' => $this->sofia->id, 'item' => $item, 'delivered' => false])->assertForbidden();
    }
}
