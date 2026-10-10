<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Libro de Reclamaciones Virtual (D.S. 011-2011-PCM y modificatorias).
 * Las hojas no se editan ni se borran: solo se agrega la respuesta.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->unsignedInteger('sequence');
            $table->string('code', 20)->unique(); // 000001-2026
            $table->string('type', 10); // reclamo | queja

            // Consumidor reclamante
            $table->string('consumer_name');
            $table->string('consumer_document_type', 10);
            $table->string('consumer_document_number', 20);
            $table->string('consumer_address');
            $table->string('consumer_phone', 20);
            $table->string('consumer_email');
            $table->boolean('is_minor')->default(false);
            $table->string('guardian_name')->nullable();
            $table->string('guardian_document_number', 20)->nullable();

            // Bien contratado
            $table->string('item_type', 10)->default('servicio'); // producto | servicio
            $table->string('item_description');
            $table->decimal('amount', 10, 2)->nullable();

            // Detalle y pedido
            $table->text('detail');
            $table->text('request');

            $table->date('response_due_on');
            $table->text('response')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->foreignId('responded_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->unique(['year', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
