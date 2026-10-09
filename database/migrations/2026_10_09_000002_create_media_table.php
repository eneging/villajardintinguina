<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('public_id');
            $table->string('resource_type', 10); // image | video | raw
            $table->string('delivery_type', 20)->default('upload'); // upload | authenticated
            $table->string('format', 20)->nullable();
            $table->unsignedBigInteger('version')->nullable();
            $table->unsignedBigInteger('bytes')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->decimal('duration', 10, 2)->nullable();
            $table->string('original_filename')->nullable();
            $table->string('status', 20)->default('ready'); // processing | ready | error
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['public_id', 'resource_type', 'delivery_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
