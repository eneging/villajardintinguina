<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->json('schedule')->nullable()->after('description'); // [{time, activity}]
            $table->json('supplies')->nullable()->after('schedule'); // [{item, quantity}]
            $table->json('weekly_menu')->nullable()->after('supplies'); // {lunes: {snack, lunch}, …}
            $table->date('menu_week_of')->nullable()->after('weekly_menu');
        });

        // Calendario de actividades del salón (salidas, celebraciones, reuniones).
        Schema::create('classroom_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('type', 20)->default('actividad');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['classroom_id', 'date']);
        });

        // Personas autorizadas a recoger al niño (además de los apoderados).
        Schema::create('authorized_pickups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('dni', 12)->nullable();
            $table->string('relationship', 40);
            $table->string('phone', 20)->nullable();
            $table->foreignId('photo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('authorized_pickups');
        Schema::dropIfExists('classroom_activities');
        Schema::table('classrooms', fn (Blueprint $table) => $table->dropColumn(['schedule', 'supplies', 'weekly_menu', 'menu_week_of']));
    }
};
