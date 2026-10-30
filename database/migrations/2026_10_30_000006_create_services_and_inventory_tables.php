<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Servicios adicionales que se cobran cada mes junto con la mensualidad.
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('description', 255)->nullable();
            $table->decimal('monthly_price', 10, 2);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('enrollment_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->decimal('price', 10, 2)->nullable(); // precio especial para este alumno
            $table->timestamps();

            $table->unique(['enrollment_id', 'service_id']);
        });

        Schema::table('charges', function (Blueprint $table) {
            $table->foreignId('service_id')->nullable()->after('concept')->constrained()->nullOnDelete();
        });

        // Inventario de materiales (educativos, limpieza, cocina, botiquín).
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('category', 30);
            $table->string('unit', 20)->default('unidad');
            $table->decimal('quantity', 10, 2)->default(0);
            $table->decimal('min_quantity', 10, 2)->default(0);
            $table->string('location', 80)->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
            $table->string('type', 10); // entrada | salida
            $table->decimal('quantity', 10, 2);
            $table->string('reason', 255)->nullable();
            $table->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        // Útiles de la lista del salón que cada niño ya entregó.
        Schema::create('supply_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('item', 120);
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['classroom_id', 'student_id', 'item']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supply_deliveries');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventory_items');
        Schema::table('charges', fn (Blueprint $table) => $table->dropConstrainedForeignId('service_id'));
        Schema::dropIfExists('enrollment_service');
        Schema::dropIfExists('services');
    }
};
