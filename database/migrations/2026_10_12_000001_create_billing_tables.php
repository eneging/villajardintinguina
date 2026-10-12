<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cuotas: lo que cada alumno debe pagar (matrícula, mensualidades, otros).
        Schema::create('charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('concept', 20); // matricula | mensualidad | otro
            $table->string('description');
            $table->string('period', 7)->nullable(); // 2026-03
            $table->decimal('amount', 10, 2);
            $table->date('due_on');
            $table->timestamp('voided_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['enrollment_id', 'concept', 'period']);
            $table->index(['due_on', 'voided_at']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('paid_on');
            $table->decimal('amount', 10, 2);
            $table->string('method', 20); // efectivo | transferencia | yape | plin | tarjeta | otro
            $table->string('operation_number', 50)->nullable();
            $table->string('status', 20)->default('confirmed'); // confirmed | pending | rejected
            $table->foreignId('voucher_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('receipt_type', 10)->nullable(); // boleta | factura
            $table->string('receipt_number', 30)->nullable();
            $table->foreignId('receipt_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('registered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['status', 'paid_on']);
        });

        // Un pago puede cubrir varias cuotas (varios meses o hermanos).
        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('charge_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });

        // Registro de recordatorios enviados (para no saturar a las familias).
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 30); // payment
            $table->string('channel', 20)->default('whatsapp');
            $table->json('payload')->nullable();
            $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'kind', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminders');
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('charges');
    }
};
