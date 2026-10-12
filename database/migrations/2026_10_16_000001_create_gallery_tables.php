<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Galería privada: álbumes por salón, visibles solo para su comunidad.
        Schema::create('albums', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('date');
            $table->boolean('published')->default(false);
            // Quién confirmó que solo aparecen niños con autorización de imagen.
            $table->foreignId('consent_confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('consent_confirmed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['classroom_id', 'published', 'date']);
        });

        Schema::create('album_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('album_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
            $table->string('caption')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['album_id', 'media_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('album_items');
        Schema::dropIfExists('albums');
    }
};
