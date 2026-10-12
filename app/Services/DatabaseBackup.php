<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use RuntimeException;

/**
 * Respaldo de la base de datos MySQL en PHP puro (el hosting compartido no
 * siempre permite ejecutar mysqldump): genera un .sql.gz con la estructura y
 * los datos de cada tabla, y conserva solo los últimos N archivos.
 */
class DatabaseBackup
{
    private const PREFIX = 'villajardin-';

    public function directory(): string
    {
        return config('school.backups_path') ?: storage_path('app/private/backups');
    }

    public function create(): string
    {
        File::ensureDirectoryExists($this->directory());

        $path = $this->directory().'/'.self::PREFIX.now()->format('Ymd-His').'.sql.gz';
        $gz = gzopen($path, 'wb6');

        if ($gz === false) {
            throw new RuntimeException("No se pudo crear {$path}");
        }

        $pdo = DB::connection()->getPdo();
        gzwrite($gz, '-- Respaldo de '.config('school.name').' · '.now()->toDateTimeString()."\nSET FOREIGN_KEY_CHECKS=0;\nSET NAMES utf8mb4;\n\n");

        foreach ($this->tables() as $table) {
            $create = (array) DB::selectOne("SHOW CREATE TABLE `{$table}`");
            gzwrite($gz, "DROP TABLE IF EXISTS `{$table}`;\n".array_values($create)[1].";\n\n");

            DB::table($table)->orderByRaw('1')->chunk(500, function (Collection $rows) use ($gz, $pdo, $table) {
                $values = $rows->map(fn ($row) => '('.collect((array) $row)
                    ->map(fn ($value) => $value === null ? 'NULL' : $pdo->quote((string) $value))
                    ->implode(',').')');

                $columns = '`'.implode('`,`', array_keys((array) $rows->first())).'`';
                gzwrite($gz, "INSERT INTO `{$table}` ({$columns}) VALUES\n".$values->implode(",\n").";\n");
            });

            gzwrite($gz, "\n");
        }

        gzwrite($gz, "SET FOREIGN_KEY_CHECKS=1;\n");
        gzclose($gz);

        $this->prune();

        return $path;
    }

    /**
     * @return list<array{name: string, size: int, created_at: string}>
     */
    public function list(): array
    {
        if (! File::isDirectory($this->directory())) {
            return [];
        }

        return collect(File::files($this->directory()))
            ->filter(fn ($file) => str_starts_with($file->getFilename(), self::PREFIX))
            ->sortByDesc(fn ($file) => $file->getFilename())
            ->map(fn ($file) => [
                'name' => $file->getFilename(),
                'size' => $file->getSize(),
                'created_at' => Carbon::createFromTimestamp($file->getMTime())->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    public function path(string $name): ?string
    {
        // Solo nombres generados por nosotros (evita rutas como ../.env).
        if (! preg_match('/^'.self::PREFIX.'\d{8}-\d{6}\.sql\.gz$/', $name)) {
            return null;
        }

        $path = $this->directory().'/'.$name;

        return File::exists($path) ? $path : null;
    }

    private function prune(): void
    {
        collect($this->list())
            ->slice(max(1, (int) config('school.backups_keep', 14)))
            ->each(fn ($backup) => File::delete($this->directory().'/'.$backup['name']));
    }

    /**
     * @return list<string>
     */
    private function tables(): array
    {
        return collect(DB::select('SHOW FULL TABLES'))
            ->map(fn ($row) => array_values((array) $row))
            ->filter(fn ($row) => ($row[1] ?? 'BASE TABLE') === 'BASE TABLE')
            ->map(fn ($row) => $row[0])
            ->values()
            ->all();
    }
}
