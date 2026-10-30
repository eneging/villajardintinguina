<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Matrícula en línea: el padre envía la ficha y la administradora la aprueba.
        Schema::create('enrollment_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->nullable()->constrained()->nullOnDelete(); // re-matrícula
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->nullable()->constrained()->nullOnDelete();
            $table->json('child');          // nombres, DNI, nacimiento, salud…
            $table->string('relationship', 30);
            $table->json('second_guardian')->nullable();
            $table->json('emergency_contact')->nullable();
            $table->json('pickups')->nullable();
            $table->json('documents')->nullable(); // [{type, media_id}]
            $table->boolean('image_consent')->default(false);
            $table->timestamp('rules_accepted_at');
            $table->string('status', 20)->default('enviada'); // enviada | observada | aprobada | rechazada
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_requests');
    }
};
