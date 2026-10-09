<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_years', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year')->unique();
            $table->date('starts_on');
            $table->date('ends_on');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('levels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedTinyInteger('min_age_months')->default(0);
            $table->unsignedTinyInteger('max_age_months')->default(72);
            $table->unsignedTinyInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('shift', 20)->default('mañana');
            $table->unsignedSmallInteger('capacity')->default(20);
            $table->string('color', 20)->default('#f59e0b');
            $table->string('mascot', 20)->nullable();
            $table->text('description')->nullable();
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->timestamps();

            $table->unique(['school_year_id', 'slug']);
        });

        Schema::create('classroom_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20)->default('titular'); // titular | auxiliar | practicante
            $table->timestamps();

            $table->unique(['classroom_id', 'user_id']);
        });

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('dni', 12)->nullable()->unique();
            $table->date('birth_date')->nullable();
            $table->string('sex', 1)->nullable();
            $table->text('allergies')->nullable();
            $table->text('medical_notes')->nullable();
            $table->boolean('image_consent')->default(false);
            $table->foreignId('photo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('relationship', 30)->default('madre');
            $table->boolean('is_billing_contact')->default(false);
            $table->boolean('can_pick_up')->default(true);
            $table->timestamps();

            $table->unique(['student_id', 'user_id']);
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classroom_id')->constrained()->restrictOnDelete();
            $table->foreignId('school_year_id')->constrained()->restrictOnDelete();
            $table->string('status', 20)->default('active'); // active | withdrawn
            $table->decimal('monthly_fee', 10, 2)->default(0);
            $table->decimal('discount_pct', 5, 2)->default(0);
            $table->timestamps();

            $table->unique(['student_id', 'school_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('guardians');
        Schema::dropIfExists('students');
        Schema::dropIfExists('classroom_staff');
        Schema::dropIfExists('classrooms');
        Schema::dropIfExists('levels');
        Schema::dropIfExists('school_years');
    }
};
