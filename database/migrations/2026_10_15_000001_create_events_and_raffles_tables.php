<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Eventos y fechas festivas con tema visual y formulario personalizable.
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('date');
            $table->json('theme'); // {color, accent, emoji}
            $table->foreignId('banner_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->json('form_schema')->nullable(); // [{key, label, type, options, required}]
            $table->boolean('per_student')->default(true); // una respuesta por hijo o por familia
            $table->boolean('registration_open')->default(true);
            $table->boolean('published')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('event_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->nullable()->constrained()->cascadeOnDelete();
            $table->json('data');
            $table->timestamps();

            $table->unique(['event_id', 'user_id', 'student_id']);
        });

        Schema::create('raffles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('prize');
            $table->decimal('ticket_price', 8, 2)->default(0);
            $table->unsignedInteger('total_tickets');
            $table->dateTime('draw_at')->nullable();
            $table->string('status', 15)->default('abierto'); // abierto | sorteado
            $table->unsignedBigInteger('winner_ticket_id')->nullable();
            $table->string('seed', 64)->nullable();
            $table->timestamp('drawn_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('raffle_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('raffle_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('number');
            $table->foreignId('buyer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('buyer_name')->nullable();
            $table->boolean('paid')->default(false);
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('sold_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['raffle_id', 'number']);
        });

        // Lo recaudado en un sorteo entra al balance como "otro ingreso".
        Schema::table('other_incomes', function (Blueprint $table) {
            $table->foreignId('raffle_id')->nullable()->after('source')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('other_incomes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('raffle_id');
        });
        Schema::dropIfExists('raffle_tickets');
        Schema::dropIfExists('raffles');
        Schema::dropIfExists('event_submissions');
        Schema::dropIfExists('events');
    }
};
