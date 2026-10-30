<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Registro de incidentes y enfermería: golpes, fiebre, medicinas.
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('classroom_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('occurred_at');
            $table->string('type', 20);
            $table->text('description');
            $table->text('action_taken')->nullable();
            $table->string('medicine', 150)->nullable();
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acknowledged_at')->nullable();
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['student_id', 'occurred_at']);
        });

        // Códigos QR de recojo: uno por apoderado y uno por persona autorizada.
        Schema::table('users', function (Blueprint $table) {
            $table->string('pickup_token', 40)->nullable()->unique()->after('active');
        });

        Schema::table('authorized_pickups', function (Blueprint $table) {
            $table->string('pickup_token', 40)->nullable()->unique()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('authorized_pickups', fn (Blueprint $table) => $table->dropColumn('pickup_token'));
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('pickup_token'));
        Schema::dropIfExists('incidents');
    }
};
