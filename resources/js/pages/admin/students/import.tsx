import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    FileDown,
    FileUp,
    Loader2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { postJson } from '@/lib/http';
import { readSpreadsheet } from '@/lib/spreadsheet';
import { cn } from '@/lib/utils';
import { index } from '@/routes/admin/students';
import { analyze, store, template } from '@/routes/admin/students/import';

type Result = {
    row: number;
    name: string;
    errors: string[];
    student: string;
    guardians: string[];
    classroom: string | null;
};

type Props = { columns: string[]; classrooms: string[]; year: number | null };

export default function ImportStudents({ columns, classrooms, year }: Props) {
    const input = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<Record<string, string>[]>([]);
    const [results, setResults] = useState<Result[] | null>(null);
    const [sendAccess, setSendAccess] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const failing = results?.filter((r) => r.errors.length > 0).length ?? 0;

    async function handleFile(file: File) {
        setError(null);
        setResults(null);
        setBusy(true);

        try {
            const parsed = await readSpreadsheet(file);
            const missing = [
                'alumno_nombres',
                'alumno_apellidos',
                'apoderado_nombre',
            ].filter((c) => !(c in (parsed[0] ?? {})));

            if (parsed.length === 0) {
                throw new Error('El archivo no tiene filas con datos.');
            }

            if (missing.length > 0) {
                throw new Error(
                    `Faltan columnas en el archivo: ${missing.join(', ')}. Usa la plantilla.`,
                );
            }

            setRows(parsed);
            const response = await postJson<{ results: Result[] }>(
                analyze.url(),
                { rows: parsed },
            );
            setResults(response.results);
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : 'No se pudo leer el archivo.',
            );
        } finally {
            setBusy(false);

            if (input.current) {
                input.current.value = '';
            }
        }
    }

    async function confirmImport() {
        setBusy(true);
        setError(null);

        try {
            await postJson(store.url(), { rows, send_access: sendAccess });
            router.visit(index.url());
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : 'No se pudo importar.',
            );
            setBusy(false);
        }
    }

    return (
        <>
            <Head title="Importar alumnos" />
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="Importar alumnos desde Excel"
                    description={`Carga a todos los alumnos con sus apoderados y su salón ${year ?? ''} de una sola vez.`}
                />

                <ol className="grid gap-4 md:grid-cols-3">
                    <li className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
                        <p className="font-semibold">
                            1. Descarga la plantilla
                        </p>
                        <p className="text-muted-foreground">
                            Ábrela en Excel. Una fila por alumno; la primera
                            fila de ejemplo la puedes borrar.
                        </p>
                        <Button variant="outline" size="sm" asChild>
                            <a href={template.url()}>
                                <FileDown /> Plantilla (Excel)
                            </a>
                        </Button>
                    </li>
                    <li className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
                        <p className="font-semibold">2. Llénala</p>
                        <p className="text-muted-foreground">
                            Fechas como 15/03/2023. Sexo F o M. Salón con uno de
                            estos nombres:{' '}
                            <strong>
                                {classrooms.join(', ') ||
                                    'crea primero los salones'}
                            </strong>
                            . El correo del apoderado es necesario para que
                            entre a la plataforma.
                        </p>
                    </li>
                    <li className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
                        <p className="font-semibold">3. Súbela y revisa</p>
                        <p className="text-muted-foreground">
                            Guárdala como .xlsx o .csv. Antes de guardar te
                            mostramos qué se hará con cada fila.
                        </p>
                        <input
                            ref={input}
                            type="file"
                            accept=".xlsx,.csv"
                            className="hidden"
                            onChange={(e) =>
                                e.target.files?.[0] &&
                                void handleFile(e.target.files[0])
                            }
                        />
                        <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => input.current?.click()}
                        >
                            {busy ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <FileUp />
                            )}{' '}
                            Elegir archivo
                        </Button>
                    </li>
                </ol>

                {error && (
                    <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-100">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />{' '}
                        {error}
                    </p>
                )}

                {results && (
                    <section className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm">
                                {results.length} fila(s) ·{' '}
                                {failing > 0 ? (
                                    <span className="font-semibold text-red-700 dark:text-red-400">
                                        {failing} con errores: corrígelas en el
                                        Excel y vuelve a subirlo.
                                    </span>
                                ) : (
                                    <span className="font-semibold text-green-700 dark:text-green-400">
                                        todo listo para importar.
                                    </span>
                                )}
                            </p>
                            {failing === 0 && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={sendAccess}
                                            onCheckedChange={(c) =>
                                                setSendAccess(c === true)
                                            }
                                        />
                                        Enviar correo de acceso a los apoderados
                                        nuevos
                                    </label>
                                    <Button
                                        disabled={busy}
                                        onClick={() => void confirmImport()}
                                    >
                                        {busy && (
                                            <Loader2 className="animate-spin" />
                                        )}{' '}
                                        Importar {results.length} alumno(s)
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="overflow-x-auto rounded-2xl border bg-card">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="p-3 font-medium">
                                            Fila
                                        </th>
                                        <th className="p-3 font-medium">
                                            Alumno
                                        </th>
                                        <th className="p-3 font-medium">
                                            Salón
                                        </th>
                                        <th className="p-3 font-medium">
                                            Apoderados
                                        </th>
                                        <th className="p-3 font-medium">
                                            Resultado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {results.map((result) => (
                                        <tr
                                            key={result.row}
                                            className={cn(
                                                result.errors.length > 0 &&
                                                    'bg-red-50/60 dark:bg-red-950/20',
                                            )}
                                        >
                                            <td className="p-3 tabular-nums">
                                                {result.row}
                                            </td>
                                            <td className="p-3">
                                                <span className="font-medium">
                                                    {result.name || '—'}
                                                </span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {result.student}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {result.classroom ?? (
                                                    <span className="text-muted-foreground">
                                                        Sin matrícula
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-xs">
                                                {result.guardians.join(' · ')}
                                            </td>
                                            <td className="p-3">
                                                {result.errors.length === 0 ? (
                                                    <CheckCircle2
                                                        className="size-5 text-green-600"
                                                        aria-label="Correcta"
                                                    />
                                                ) : (
                                                    <ul className="list-inside list-disc text-xs text-red-800 dark:text-red-300">
                                                        {result.errors.map(
                                                            (e) => (
                                                                <li key={e}>
                                                                    {e}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                <details className="text-sm text-muted-foreground">
                    <summary className="cursor-pointer">
                        Columnas de la plantilla
                    </summary>
                    <p className="mt-2 font-mono text-xs">
                        {columns.join(' · ')}
                    </p>
                </details>
                <Button variant="ghost" asChild>
                    <Link href={index()}>Volver a alumnos</Link>
                </Button>
            </div>
        </>
    );
}

ImportStudents.layout = {
    breadcrumbs: [
        { title: 'Alumnos', href: index() },
        { title: 'Importar', href: index() },
    ],
};
