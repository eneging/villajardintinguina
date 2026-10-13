<?php

namespace App\Support;

use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CSV que Excel abre bien en español: separador ";" y BOM para las tildes.
 */
class CsvExport
{
    /**
     * @param  list<string>  $headers
     * @param  iterable<array<int, mixed>>  $rows
     */
    public static function download(string $filename, array $headers, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers, ';');

            foreach ($rows as $row) {
                fputcsv($out, array_map(fn ($value) => self::cell($value), $row), ';');
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private static function cell(mixed $value): string
    {
        if (is_float($value)) {
            return number_format($value, 2, ',', '');
        }

        if (is_bool($value)) {
            return $value ? 'Sí' : 'No';
        }

        $text = (string) $value;

        // Evita que Excel interprete el texto como fórmula (inyección CSV).
        return preg_match('/^[=+\-@\t\r]/', $text) ? "'".$text : $text;
    }
}
