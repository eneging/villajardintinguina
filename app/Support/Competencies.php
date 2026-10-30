<?php

namespace App\Support;

/**
 * Competencias del Currículo Nacional (CNEB) evaluadas en educación inicial,
 * agrupadas por área, y la escala de calificación literal.
 */
class Competencies
{
    public const GRADES = [
        'AD' => 'Logro destacado',
        'A' => 'Logro esperado',
        'B' => 'En proceso',
        'C' => 'En inicio',
    ];

    /**
     * @return array<string, array{area: string, competencies: array<string, string>}>
     */
    public static function areas(): array
    {
        return [
            'personal_social' => ['area' => 'Personal Social', 'competencies' => [
                'identidad' => 'Construye su identidad',
                'convive' => 'Convive y participa democráticamente en la búsqueda del bien común',
            ]],
            'psicomotriz' => ['area' => 'Psicomotriz', 'competencies' => [
                'motricidad' => 'Se desenvuelve de manera autónoma a través de su motricidad',
            ]],
            'comunicacion' => ['area' => 'Comunicación', 'competencies' => [
                'oral' => 'Se comunica oralmente en su lengua materna',
                'lee' => 'Lee diversos tipos de textos escritos en su lengua materna',
                'escribe' => 'Escribe diversos tipos de textos en su lengua materna',
                'arte' => 'Crea proyectos desde los lenguajes artísticos',
            ]],
            'matematica' => ['area' => 'Matemática', 'competencies' => [
                'cantidad' => 'Resuelve problemas de cantidad',
                'forma' => 'Resuelve problemas de forma, movimiento y localización',
            ]],
            'ciencia_tecnologia' => ['area' => 'Ciencia y Tecnología', 'competencies' => [
                'indaga' => 'Indaga mediante métodos científicos para construir sus conocimientos',
            ]],
            'transversales' => ['area' => 'Competencias transversales', 'competencies' => [
                'tic' => 'Se desenvuelve en entornos virtuales generados por las TIC',
                'autonomo' => 'Gestiona su aprendizaje de manera autónoma',
            ]],
        ];
    }

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return collect(self::areas())->flatMap(fn ($area) => array_keys($area['competencies']))->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    public static function forClient(): array
    {
        return [
            'grades' => collect(self::GRADES)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
            'areas' => collect(self::areas())->map(fn ($area, $key) => [
                'key' => $key,
                'area' => $area['area'],
                'competencies' => collect($area['competencies'])->map(fn ($label, $value) => ['key' => $value, 'label' => $label])->values(),
            ])->values(),
        ];
    }
}
