<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Trabajadores (pueden no tener cuenta: limpieza, cocina…).
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('dni', 12)->nullable();
            $table->string('position', 30); // maestra | auxiliar | practicante | limpieza | cocina | administracion | otro
            $table->string('regime', 20); // planilla | honorarios | practicas
            $table->string('pension_system', 10)->default('ninguno'); // onp | afp | ninguno
            $table->decimal('base_salary', 10, 2);
            $table->string('bank', 50)->nullable();
            $table->string('account_number', 40)->nullable();
            $table->date('hired_on')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->id();
            $table->string('period', 7)->unique(); // 2026-10
            $table->string('status', 15)->default('borrador'); // borrador | aprobada | pagada
            $table->decimal('total_net', 12, 2)->default(0);
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_run_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->restrictOnDelete();
            $table->decimal('base_salary', 10, 2);
            $table->unsignedSmallInteger('absences')->default(0);
            $table->decimal('absence_deduction', 10, 2)->default(0);
            $table->unsignedInteger('late_minutes')->default(0);
            $table->decimal('late_deduction', 10, 2)->default(0);
            $table->decimal('bonuses', 10, 2)->default(0);
            $table->decimal('other_deductions', 10, 2)->default(0);
            $table->string('retention_label', 40)->nullable();
            $table->decimal('retention', 10, 2)->default(0);
            $table->decimal('net', 10, 2)->default(0);
            $table->date('paid_on')->nullable();
            $table->string('payment_method', 20)->nullable();
            $table->string('operation_number', 50)->nullable();
            $table->foreignId('voucher_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->unique(['payroll_run_id', 'employee_id']);
        });

        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expense_category_id')->constrained()->restrictOnDelete();
            $table->date('date');
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->string('method', 20)->default('efectivo');
            $table->foreignId('receipt_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('date');
        });

        Schema::create('other_incomes', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('source', 20); // sorteo | evento | donacion | otro
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('other_incomes');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('expense_categories');
        Schema::dropIfExists('payroll_items');
        Schema::dropIfExists('payroll_runs');
        Schema::dropIfExists('employees');
    }
};
