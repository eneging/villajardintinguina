<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Classroom;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Throwable;

/**
 * Importa alumnos con sus apoderados y matrícula desde una hoja de cálculo
 * (una fila por alumno). Primero analiza todas las filas sin guardar nada;
 * solo si no hay errores las guarda en una sola transacción.
 */
class StudentImporter
{
    /** Columnas de la plantilla, en orden. */
    public const COLUMNS = [
        'alumno_nombres', 'alumno_apellidos', 'alumno_dni', 'fecha_nacimiento', 'sexo', 'salon', 'mensualidad',
        'alergias', 'autoriza_imagen',
        'apoderado_nombre', 'apoderado_dni', 'apoderado_celular', 'apoderado_correo', 'parentesco',
        'apoderado2_nombre', 'apoderado2_dni', 'apoderado2_celular', 'apoderado2_correo', 'parentesco2',
    ];

    public const EXAMPLE = [
        'Sofía', 'Quispe Rojas', '90000011', '15/03/2023', 'F', 'Patitos', '350',
        'Maní', 'si',
        'Carmen Rojas', '41234567', '987654321', 'carmen.rojas@gmail.com', 'madre',
        'Luis Quispe', '42345678', '956111222', '', 'padre',
    ];

    /** @var Collection<string, Classroom> */
    private Collection $classrooms;

    public function __construct()
    {
        $this->classrooms = Classroom::query()
            ->where('school_year_id', SchoolYear::current()?->id)
            ->get()
            ->keyBy(fn (Classroom $classroom) => Str::lower(Str::ascii($classroom->name)));
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array{row: int, name: string, errors: list<string>, student: string, guardians: list<string>, classroom: string|null}>
     */
    public function analyze(array $rows): array
    {
        $seenStudentDni = [];
        $results = [];

        foreach (array_values($rows) as $index => $raw) {
            $row = $this->normalize($raw);
            $errors = [];

            if (! $row['alumno_nombres'] || ! $row['alumno_apellidos']) {
                $errors[] = 'Faltan los nombres o apellidos del alumno.';
            }

            if ($row['alumno_dni'] && ! preg_match('/^\d{8}$/', $row['alumno_dni'])) {
                $errors[] = 'El DNI del alumno debe tener 8 dígitos.';
            }

            if ($row['alumno_dni'] && in_array($row['alumno_dni'], $seenStudentDni, true)) {
                $errors[] = 'El DNI del alumno se repite en otra fila.';
            }

            if ($row['alumno_dni']) {
                $seenStudentDni[] = $row['alumno_dni'];
            }

            if ($row['fecha_nacimiento'] === false) {
                $errors[] = 'Fecha de nacimiento no válida (usa dd/mm/aaaa).';
            }

            if ($row['sexo'] === false) {
                $errors[] = 'Sexo debe ser F o M.';
            }

            if ($row['salon'] && ! $this->classrooms->has($row['salon_key'])) {
                $errors[] = "No existe el salón «{$row['salon']}» en el año activo.";
            }

            if ($row['salon'] && $row['mensualidad'] === null) {
                $errors[] = 'Indica la mensualidad del alumno.';
            }

            if ($row['mensualidad'] === false) {
                $errors[] = 'La mensualidad debe ser un número.';
            }

            $guardianLabels = [];

            foreach ($this->guardiansOf($row) as $n => $guardian) {
                $label = $n === 0 ? 'apoderado' : 'segundo apoderado';

                if (! $guardian['email'] && ! $this->findParent($guardian)) {
                    $errors[] = "Falta el correo del {$label} (lo necesita para entrar a la plataforma).";
                }

                if ($guardian['email'] && ! filter_var($guardian['email'], FILTER_VALIDATE_EMAIL)) {
                    $errors[] = "El correo del {$label} no es válido.";
                }

                if ($guardian['dni'] && ! preg_match('/^\d{8}$/', $guardian['dni'])) {
                    $errors[] = "El DNI del {$label} debe tener 8 dígitos.";
                }

                $guardianLabels[] = ($this->findParent($guardian) ? 'Existente: ' : 'Nuevo: ').$guardian['name'];
            }

            if ($this->guardiansOf($row) === []) {
                $errors[] = 'Falta el nombre del apoderado.';
            }

            $existing = $this->findStudent($row);
            $results[] = [
                'row' => $index + 2, // fila 1 = encabezados
                'name' => trim("{$row['alumno_nombres']} {$row['alumno_apellidos']}"),
                'errors' => $errors,
                'student' => $existing ? 'Actualizar ficha existente' : 'Nuevo alumno',
                'guardians' => $guardianLabels,
                'classroom' => $row['salon'] ? ($this->classrooms->get($row['salon_key'])?->name ?? $row['salon']) : null,
            ];
        }

        return $results;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array{students: int, parents: int, invited: int}
     */
    public function import(array $rows, bool $sendAccess = false): array
    {
        $year = SchoolYear::current();
        $created = ['students' => 0, 'parents' => 0, 'invited' => 0];
        $newParents = collect();

        DB::transaction(function () use ($rows, $year, &$created, $newParents) {
            foreach ($rows as $raw) {
                $row = $this->normalize($raw);

                $student = $this->findStudent($row) ?? new Student;
                $created['students'] += $student->exists ? 0 : 1;
                $student->fill(array_filter([
                    'first_name' => $row['alumno_nombres'],
                    'last_name' => $row['alumno_apellidos'],
                    'dni' => $row['alumno_dni'],
                    'birth_date' => $row['fecha_nacimiento'] ?: null,
                    'sex' => $row['sexo'] ?: null,
                    'allergies' => $row['alergias'],
                ], fn ($value) => $value !== null && $value !== ''))
                    ->fill(['image_consent' => $row['autoriza_imagen']])
                    ->save();

                foreach ($this->guardiansOf($row) as $n => $guardian) {
                    $parent = $this->findParent($guardian);

                    if (! $parent) {
                        $parent = User::create([
                            'name' => $guardian['name'],
                            'email' => $guardian['email'],
                            'dni' => $guardian['dni'],
                            'phone' => $guardian['phone'],
                            'password' => Str::password(32),
                        ]);
                        $created['parents']++;
                        $newParents->push($parent);
                    } else {
                        $parent->fill(array_filter(['phone' => $guardian['phone'], 'dni' => $parent->dni ?: $guardian['dni']]))->save();
                    }

                    $parent->assignRole(Role::Parent);
                    $student->guardians()->syncWithoutDetaching([
                        $parent->id => ['relationship' => $guardian['relationship'] ?: 'apoderado', 'is_billing_contact' => $n === 0, 'can_pick_up' => true],
                    ]);
                }

                if ($row['salon'] && $year) {
                    $student->enrollments()->updateOrCreate(
                        ['school_year_id' => $year->id],
                        ['classroom_id' => $this->classrooms->get($row['salon_key'])->id, 'monthly_fee' => $row['mensualidad'] ?? 0, 'status' => 'active'],
                    );
                }
            }
        });

        if ($sendAccess) {
            foreach ($newParents as $parent) {
                try {
                    Password::sendResetLink(['email' => $parent->email]);
                    $created['invited']++;
                } catch (Throwable $exception) {
                    report($exception);
                }
            }
        }

        return $created;
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, mixed>
     */
    private function normalize(array $raw): array
    {
        $value = fn (string $key) => ($v = trim((string) ($raw[$key] ?? ''))) === '' ? null : $v;
        $digits = fn (string $key) => ($v = preg_replace('/\D/', '', (string) ($raw[$key] ?? ''))) === '' ? null : $v;

        $sex = Str::upper(Str::substr((string) $value('sexo'), 0, 1));
        $fee = $value('mensualidad');
        $fee = $fee === null ? null : str_replace([',', 'S/', 's/', ' '], ['.', '', '', ''], $fee);

        return [
            'alumno_nombres' => $value('alumno_nombres'),
            'alumno_apellidos' => $value('alumno_apellidos'),
            'alumno_dni' => $digits('alumno_dni'),
            'fecha_nacimiento' => $this->date($value('fecha_nacimiento')),
            'sexo' => $sex === '' ? null : (in_array($sex, ['F', 'M'], true) ? $sex : false),
            'salon' => $value('salon'),
            'salon_key' => Str::lower(Str::ascii((string) $value('salon'))),
            'mensualidad' => $fee === null ? null : (is_numeric($fee) ? (float) $fee : false),
            'alergias' => $value('alergias'),
            'autoriza_imagen' => in_array(Str::lower(Str::ascii((string) $value('autoriza_imagen'))), ['si', 's', 'yes', '1', 'x'], true),
            'apoderado_nombre' => $value('apoderado_nombre'),
            'apoderado_dni' => $digits('apoderado_dni'),
            'apoderado_celular' => $value('apoderado_celular'),
            'apoderado_correo' => Str::lower((string) $value('apoderado_correo')) ?: null,
            'parentesco' => Str::lower((string) $value('parentesco')) ?: null,
            'apoderado2_nombre' => $value('apoderado2_nombre'),
            'apoderado2_dni' => $digits('apoderado2_dni'),
            'apoderado2_celular' => $value('apoderado2_celular'),
            'apoderado2_correo' => Str::lower((string) $value('apoderado2_correo')) ?: null,
            'parentesco2' => Str::lower((string) $value('parentesco2')) ?: null,
        ];
    }

    /** dd/mm/aaaa, aaaa-mm-dd o número de serie de Excel. null si está vacía, false si no es válida. */
    private function date(?string $value): string|false|null
    {
        if ($value === null) {
            return null;
        }

        try {
            $date = match (true) {
                (bool) preg_match('/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/', $value, $m) => checkdate((int) $m[2], (int) $m[1], (int) $m[3])
                    ? CarbonImmutable::create((int) $m[3], (int) $m[2], (int) $m[1])
                    : null,
                (bool) preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $value, $m) => checkdate((int) $m[2], (int) $m[3], (int) $m[1])
                    ? CarbonImmutable::create((int) $m[1], (int) $m[2], (int) $m[3])
                    : null,
                is_numeric($value) && (int) $value > 20000 => CarbonImmutable::create(1899, 12, 30)->addDays((int) $value),
                default => null,
            };
        } catch (Throwable) {
            return false;
        }

        if (! $date || $date->isFuture() || $date->lt(now()->subYears(8)->startOfDay())) {
            return false;
        }

        return $date->toDateString();
    }

    /**
     * @param  array<string, mixed>  $row
     * @return list<array{name: string, dni: string|null, phone: string|null, email: string|null, relationship: string|null}>
     */
    private function guardiansOf(array $row): array
    {
        $guardians = [];

        foreach (['apoderado' => 'parentesco', 'apoderado2' => 'parentesco2'] as $prefix => $relationship) {
            if ($row["{$prefix}_nombre"]) {
                $guardians[] = [
                    'name' => $row["{$prefix}_nombre"],
                    'dni' => $row["{$prefix}_dni"],
                    'phone' => $row["{$prefix}_celular"],
                    'email' => $row["{$prefix}_correo"],
                    'relationship' => $row[$relationship],
                ];
            }
        }

        return $guardians;
    }

    /**
     * @param  array{email: string|null, dni: string|null}  $guardian
     */
    private function findParent(array $guardian): ?User
    {
        return ($guardian['email'] ? User::where('email', $guardian['email'])->first() : null)
            ?? ($guardian['dni'] ? User::where('dni', $guardian['dni'])->first() : null);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function findStudent(array $row): ?Student
    {
        if ($row['alumno_dni']) {
            return Student::where('dni', $row['alumno_dni'])->first();
        }

        return $row['fecha_nacimiento']
            ? Student::where('first_name', $row['alumno_nombres'])->where('last_name', $row['alumno_apellidos'])->whereDate('birth_date', $row['fecha_nacimiento'])->first()
            : null;
    }
}
