<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cuaderno diario: cómo comió, durmió, pañales, ánimo y una foto del día.
        Schema::create('daily_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->json('meals')->nullable();   // [{moment, amount, note}]
            $table->json('naps')->nullable();    // [{from, to}]
            $table->json('diapers')->nullable(); // [{time, type}]
            $table->string('mood', 20)->nullable();
            $table->text('note')->nullable();
            $table->string('needs', 255)->nullable(); // "Traer pañales y una muda"
            $table->foreignId('photo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'date']);
            $table->index(['classroom_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_logs');
    }
};
