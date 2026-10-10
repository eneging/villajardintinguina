<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('induction_lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('audience', 20)->default('parents'); // parents | staff
            $table->boolean('is_required')->default(false);
            $table->string('status', 20)->default('draft'); // draft | published
            $table->unsignedSmallInteger('position')->default(0);
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->timestamps();
        });

        // A quién va dirigida: general, uno o varios niveles, o uno o varios salones.
        Schema::create('induction_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('induction_lesson_id')->constrained()->cascadeOnDelete();
            $table->string('scope', 20); // general | level | classroom
            $table->unsignedBigInteger('scope_id')->nullable();
            $table->timestamps();

            $table->index(['scope', 'scope_id']);
        });

        Schema::create('induction_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('induction_lesson_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('completed_at');
            $table->timestamp('accepted_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->unique(['induction_lesson_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('induction_progress');
        Schema::dropIfExists('induction_assignments');
        Schema::dropIfExists('induction_lessons');
    }
};
