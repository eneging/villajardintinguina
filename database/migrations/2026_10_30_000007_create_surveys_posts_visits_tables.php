<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Encuestas de satisfacción.
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('audience', 20)->default('parents'); // parents | staff | all
            $table->json('questions');
            $table->boolean('anonymous')->default(true);
            $table->date('closes_on')->nullable();
            $table->boolean('published')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->json('answers');
            $table->timestamps();

            $table->unique(['survey_id', 'user_id']);
        });

        // Noticias del sitio web.
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->string('slug', 170)->unique();
            $table->string('excerpt', 300)->nullable();
            $table->longText('body');
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Agenda de visitas guiadas para familias interesadas.
        Schema::create('visit_slots', function (Blueprint $table) {
            $table->id();
            $table->dateTime('starts_at');
            $table->unsignedSmallInteger('capacity')->default(3);
            $table->timestamps();

            $table->unique('starts_at');
        });

        Schema::create('visit_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visit_slot_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->string('parent_name', 150);
            $table->string('phone', 20);
            $table->string('email')->nullable();
            $table->string('child_name', 150)->nullable();
            $table->string('notes', 500)->nullable();
            $table->string('status', 20)->default('confirmada'); // confirmada | asistio | no_asistio | cancelada
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visit_bookings');
        Schema::dropIfExists('visit_slots');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('surveys');
    }
};
