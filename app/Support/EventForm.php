<?php

namespace App\Support;

use Illuminate\Validation\Rule;

/**
 * Formularios personalizables de eventos: definición de campos y reglas de validación.
 */
class EventForm
{
    public const TYPES = ['text', 'textarea', 'number', 'select', 'checkbox'];

    /**
     * Reglas para validar la definición del formulario que arma la administradora.
     *
     * @return array<string, mixed>
     */
    public static function schemaRules(): array
    {
        return [
            'form_schema' => ['array', 'max:20'],
            'form_schema.*.label' => ['required', 'string', 'max:120'],
            'form_schema.*.type' => ['required', Rule::in(self::TYPES)],
            'form_schema.*.required' => ['boolean'],
            'form_schema.*.options' => ['array', 'max:20', 'required_if:form_schema.*.type,select'],
            'form_schema.*.options.*' => ['nullable', 'string', 'max:80'],
        ];
    }

    /**
     * Normaliza la definición: genera claves estables y limpia opciones vacías.
     *
     * @param  array<int, array<string, mixed>>  $fields
     * @return list<array<string, mixed>>
     */
    public static function normalize(array $fields): array
    {
        return array_values(array_map(fn ($field, $index) => [
            'key' => $field['key'] ?? 'campo_'.($index + 1).'_'.substr(md5($field['label']), 0, 6),
            'label' => $field['label'],
            'type' => $field['type'],
            'required' => (bool) ($field['required'] ?? false),
            'options' => $field['type'] === 'select' ? array_values(array_filter($field['options'] ?? [], 'filled')) : [],
        ], $fields, array_keys($fields)));
    }

    /**
     * Reglas para validar la respuesta de un padre.
     *
     * @param  list<array<string, mixed>>  $schema
     * @return array<string, mixed>
     */
    public static function answerRules(array $schema): array
    {
        $rules = ['data' => ['array']];

        foreach ($schema as $field) {
            $base = $field['required'] ? ['required'] : ['nullable'];
            $rules["data.{$field['key']}"] = match ($field['type']) {
                'number' => [...$base, 'numeric', 'min:0', 'max:9999'],
                'select' => [...$base, Rule::in($field['options'])],
                'checkbox' => $field['required'] ? ['accepted'] : ['nullable', 'boolean'],
                'textarea' => [...$base, 'string', 'max:2000'],
                default => [...$base, 'string', 'max:255'],
            };
        }

        return $rules;
    }

    /**
     * @param  list<array<string, mixed>>  $schema
     * @return array<string, string>
     */
    public static function answerAttributes(array $schema): array
    {
        return collect($schema)->mapWithKeys(fn ($field) => ["data.{$field['key']}" => mb_strtolower($field['label'])])->all();
    }
}
