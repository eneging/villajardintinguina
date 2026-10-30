<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Cuaderno diario del niño (sobre todo guardería): lo que la maestra le cuenta a la familia cada día.
 */
#[Fillable(['student_id', 'classroom_id', 'date', 'meals', 'naps', 'diapers', 'mood', 'note', 'needs', 'photo_media_id', 'recorded_by', 'sent_at'])]
class DailyLog extends Model
{
    public const MOMENTS = ['desayuno' => 'Desayuno', 'refrigerio' => 'Refrigerio', 'almuerzo' => 'Almuerzo', 'lonche' => 'Lonche'];

    public const AMOUNTS = ['todo' => 'Comió todo', 'mitad' => 'Comió la mitad', 'poco' => 'Comió poco', 'nada' => 'No comió'];

    public const DIAPERS = ['pipi' => 'Pipí', 'popo' => 'Popó', 'ambos' => 'Pipí y popó', 'bano' => 'Fue al baño solo(a)'];

    public const MOODS = [
        'feliz' => ['label' => 'Feliz', 'emoji' => '😄'],
        'tranquilo' => ['label' => 'Tranquilo', 'emoji' => '🙂'],
        'cansado' => ['label' => 'Cansado', 'emoji' => '😴'],
        'inquieto' => ['label' => 'Inquieto', 'emoji' => '😣'],
        'triste' => ['label' => 'Triste', 'emoji' => '😢'],
        'enfermo' => ['label' => 'Se sintió mal', 'emoji' => '🤒'],
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'meals' => 'array',
            'naps' => 'array',
            'diapers' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return BelongsTo<Classroom, $this> */
    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    /** @return BelongsTo<Media, $this> */
    public function photo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'photo_media_id');
    }

    /** @return BelongsTo<User, $this> */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /** Minutos de siesta en total. */
    public function napMinutes(): int
    {
        return collect($this->naps ?? [])->sum(function (array $nap) {
            if (empty($nap['from']) || empty($nap['to'])) {
                return 0;
            }

            [$fh, $fm] = array_map('intval', explode(':', $nap['from']));
            [$th, $tm] = array_map('intval', explode(':', $nap['to']));

            return max(0, ($th * 60 + $tm) - ($fh * 60 + $fm));
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'date' => $this->date->toDateString(),
            'meals' => $this->meals ?? [],
            'naps' => $this->naps ?? [],
            'diapers' => $this->diapers ?? [],
            'mood' => $this->mood,
            'note' => $this->note,
            'needs' => $this->needs,
            'photo' => $this->photo?->toClient(),
            'photo_media_id' => $this->photo_media_id,
            'nap_minutes' => $this->napMinutes(),
            'recorded_by' => $this->recorder?->name,
            'sent_at' => $this->sent_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function options(): array
    {
        $pairs = fn (array $map) => collect($map)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values();

        return [
            'moments' => $pairs(self::MOMENTS),
            'amounts' => $pairs(self::AMOUNTS),
            'diapers' => $pairs(self::DIAPERS),
            'moods' => collect(self::MOODS)->map(fn ($mood, $value) => ['value' => $value, ...$mood])->values(),
        ];
    }
}
