<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

/**
 * Registra en `audit_logs` cada alta, cambio y baja del modelo.
 */
trait Auditable
{
    /** Campos que no se guardan en la auditoría. */
    protected static array $auditExclude = ['created_at', 'updated_at', 'remember_token', 'password'];

    public static function bootAuditable(): void
    {
        static::created(fn (Model $model) => self::audit($model, 'created', null, $model->getAttributes()));

        static::updated(function (Model $model) {
            $changes = Arr::except($model->getChanges(), self::$auditExclude);

            if ($changes !== []) {
                self::audit($model, 'updated', Arr::only($model->getOriginal(), array_keys($changes)), $changes);
            }
        });

        static::deleted(fn (Model $model) => self::audit($model, 'deleted', $model->getOriginal(), null));
    }

    /**
     * @param  array<string, mixed>|null  $old
     * @param  array<string, mixed>|null  $new
     */
    private static function audit(Model $model, string $event, ?array $old, ?array $new): void
    {
        $clean = fn (?array $values) => $values === null ? null : collect(Arr::except($values, self::$auditExclude))
            ->map(fn ($value) => $value instanceof \DateTimeInterface ? $value->format('Y-m-d H:i:s') : ($value instanceof \BackedEnum ? $value->value : $value))
            ->all();

        AuditLog::create([
            'user_id' => auth()->id(),
            'event' => $event,
            'auditable_type' => class_basename($model),
            'auditable_id' => $model->getKey(),
            'old_values' => $clean($old),
            'new_values' => $clean($new),
            'ip_address' => app()->runningInConsole() ? null : request()->ip(),
        ]);
    }
}
