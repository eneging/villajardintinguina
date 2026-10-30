<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bimestres o trimestres del año escolar.
        Schema::create('grading_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->date('starts_on');
            $table->date('ends_on');
            $table->timestamp('published_at')->nullable(); // visible para las familias
            $table->timestamps();
        });

        // Libreta de un alumno en un periodo: calificación por competencia (AD, A, B, C).
        Schema::create('report_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grading_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->json('grades')->nullable(); // {competencia: {grade, conclusion}}
            $table->text('comment')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['grading_period_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_cards');
        Schema::dropIfExists('grading_periods');
    }
};
