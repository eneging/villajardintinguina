import { readSheet } from 'read-excel-file/browser';

type Cell = string | number | boolean | Date | null;

function cellText(cell: Cell): string {
    if (cell === null || cell === undefined) {
        return '';
    }

    if (cell instanceof Date) {
        // Excel guarda las fechas a medianoche UTC.
        return cell.toISOString().slice(0, 10);
    }

    return String(cell).trim();
}

/** Lee un CSV de Excel en español (separador ; o ,) con comillas. */
function parseCsv(text: string): string[][] {
    const clean = text.replace(/^﻿/, '');
    const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
    const separator =
        (firstLine.match(/;/g)?.length ?? 0) >=
        (firstLine.match(/,/g)?.length ?? 0)
            ? ';'
            : ',';
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];

        if (quoted) {
            if (char === '"' && clean[i + 1] === '"') {
                field += '"';
                i++;
            } else if (char === '"') {
                quoted = false;
            } else {
                field += char;
            }
        } else if (char === '"') {
            quoted = true;
        } else if (char === separator) {
            row.push(field);
            field = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && clean[i + 1] === '\n') {
                i++;
            }

            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += char;
        }
    }

    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows;
}

/**
 * Lee un .xlsx o .csv y devuelve una fila por objeto usando la primera fila
 * como encabezados (en minúsculas y sin espacios alrededor).
 */
export async function readSpreadsheet(
    file: File,
): Promise<Record<string, string>[]> {
    const raw: string[][] = file.name.toLowerCase().endsWith('.csv')
        ? parseCsv(await file.text())
        : (await readSheet(file)).map((row) =>
              row.map((cell) => cellText(cell as Cell)),
          );

    const [header = [], ...body] = raw;
    const keys = header.map((h) => h.trim().toLowerCase());

    return body
        .filter((row) => row.some((cell) => cell.trim() !== ''))
        .map((row) =>
            Object.fromEntries(
                keys.map((key, i) => [key, (row[i] ?? '').trim()]),
            ),
        );
}
