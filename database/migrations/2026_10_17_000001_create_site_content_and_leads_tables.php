<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Textos e imágenes del sitio público, editables por la administradora.
        Schema::create('site_contents', function (Blueprint $table) {
            $table->id();
            $table->string('section', 40)->unique();
            $table->json('value');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Solicitudes de admisión / pre-inscripción desde el sitio web.
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('parent_name', 150);
            $table->string('phone', 20);
            $table->string('email')->nullable();
            $table->string('child_name', 150)->nullable();
            $table->date('child_birth_date')->nullable();
            $table->string('level_interest', 60)->nullable();
            $table->text('message')->nullable();
            $table->string('status', 20)->default('nuevo'); // nuevo | contactado | visita | matriculado | descartado
            $table->string('source', 20)->default('web'); // web | whatsapp | referido | redes | otro
            $table->text('notes')->nullable();
            $table->timestamp('contacted_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });

        Schema::table('induction_lessons', function (Blueprint $table) {
            // Visible en el sitio público (sección "Conócenos en video").
            $table->boolean('is_public')->default(false)->after('is_required');
        });

        Schema::table('albums', function (Blueprint $table) {
            // Álbum mostrado en la galería pública del sitio web.
            $table->boolean('is_public')->default(false)->after('published');
        });
    }

    public function down(): void
    {
        Schema::table('albums', fn (Blueprint $table) => $table->dropColumn('is_public'));
        Schema::table('induction_lessons', fn (Blueprint $table) => $table->dropColumn('is_public'));
        Schema::dropIfExists('leads');
        Schema::dropIfExists('site_contents');
    }
};
