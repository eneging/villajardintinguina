<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('owner_type', 15); // institution | student | employee
            $table->unsignedBigInteger('owner_id')->nullable();
            $table->string('category', 40);
            $table->string('title');
            $table->foreignId('media_id')->constrained('media')->restrictOnDelete();
            $table->date('expires_on')->nullable();
            // institution: staff | families | all · student/employee: private | shared
            $table->string('visibility', 15)->default('private');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['owner_type', 'owner_id']);
            $table->index('expires_on');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
