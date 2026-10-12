<?php

namespace App\Support;

/**
 * Contenido inicial del sitio público. La administradora lo reemplaza desde
 * la intranet (Sitio web) sin tocar código; aquí solo vive el punto de partida.
 */
class SiteDefaults
{
    /** Íconos disponibles para servicios y pilares (nombres de lucide-react). */
    public const ICONS = [
        'heart-handshake', 'book-open', 'music', 'soup', 'shield-check', 'camera',
        'palette', 'languages', 'baby', 'puzzle', 'sprout', 'bike', 'sun', 'star',
        'smile', 'stethoscope', 'bus', 'clock',
    ];

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function all(): array
    {
        return [
            'hero' => [
                'badge' => 'Matrículas abiertas',
                'title' => 'Donde los niños',
                'highlight' => 'florecen',
                'title_end' => 'jugando y aprendiendo',
                'subtitle' => 'Colegio de educación inicial y guardería en Ica. Un segundo hogar lleno de color, cariño y aprendizaje para tus hijos de 0 a 5 años.',
                'image_media_id' => null,
                'video_media_id' => null,
                'video_url' => null,
            ],
            'about' => [
                'title' => 'Somos Villa Jardín',
                'intro' => 'Un colegio de educación inicial y guardería en Ica donde cada niño es acompañado con cariño, respeto y alegría. Creemos que los primeros años son los más importantes para crecer seguros, curiosos y felices.',
                'mission' => 'Brindar una educación inicial de calidad, basada en el juego, el afecto y el respeto a los ritmos de cada niño, en alianza con las familias.',
                'vision' => 'Ser el jardín de referencia en Ica por su calidez humana, su propuesta pedagógica innovadora y la cercanía con los padres.',
                'values' => ['Amor', 'Respeto', 'Responsabilidad', 'Creatividad', 'Alegría'],
                'proposal_title' => 'Nuestra propuesta pedagógica',
                'proposal' => 'Trabajamos con el Currículo Nacional de Educación Básica (CNEB) y lo enriquecemos con proyectos de aprendizaje, juego libre en los sectores, psicomotricidad, arte e inglés. Cada semana las maestras publican en la plataforma los módulos que trabajarán, para que las familias acompañen desde casa.',
                'pillars' => [
                    ['icon' => 'puzzle', 'title' => 'Aprender jugando', 'text' => 'El juego es el motor del aprendizaje: exploran, crean y resuelven problemas.'],
                    ['icon' => 'heart-handshake', 'title' => 'Vínculo afectivo', 'text' => 'Maestras cercanas que conocen a cada niño por su nombre y su historia.'],
                    ['icon' => 'sprout', 'title' => 'Autonomía', 'text' => 'Rutinas que les enseñan a hacer las cosas por sí mismos con confianza.'],
                    ['icon' => 'book-open', 'title' => 'Familias informadas', 'text' => 'Módulos, comunicados, fotos y asistencia en la plataforma para padres.'],
                ],
                'image_media_id' => null,
            ],
            'levels' => [
                'items' => [
                    ['name' => 'Guardería / Cuna', 'age' => 'Desde los 6 meses', 'mascot' => '🐣', 'color' => '#f59e0b', 'text' => 'Cuidado amoroso, estimulación temprana y rutinas de sueño y alimentación.'],
                    ['name' => 'Inicial 3 años', 'age' => 'Salón Patitos', 'mascot' => '🐥', 'color' => '#0ea5e9', 'text' => 'Autonomía, lenguaje y juego libre para descubrir el mundo.'],
                    ['name' => 'Inicial 4 años', 'age' => 'Salón Ositos', 'mascot' => '🐻', 'color' => '#22c55e', 'text' => 'Proyectos, arte y psicomotricidad para crecer con confianza.'],
                    ['name' => 'Inicial 5 años', 'age' => 'Salón Leoncitos', 'mascot' => '🦁', 'color' => '#ef4444', 'text' => 'Preparación para primaria: pre-escritura, lógica y valores.'],
                ],
            ],
            'services' => [
                'items' => [
                    ['icon' => 'heart-handshake', 'title' => 'Maestras con vocación', 'text' => 'Docentes tituladas que acompañan a cada niño con cariño y paciencia.'],
                    ['icon' => 'book-open', 'title' => 'Papás informados', 'text' => 'Cada semana publicamos en la plataforma lo que aprenderán sus hijos.'],
                    ['icon' => 'music', 'title' => 'Talleres', 'text' => 'Música, inglés, arte y psicomotricidad como parte de la jornada.'],
                    ['icon' => 'soup', 'title' => 'Alimentación', 'text' => 'Loncheras y menús balanceados pensados para su edad.'],
                    ['icon' => 'shield-check', 'title' => 'Ambiente seguro', 'text' => 'Protocolo de recojo con personas autorizadas y espacios adaptados.'],
                    ['icon' => 'camera', 'title' => 'Momentos compartidos', 'text' => 'Fotos y videos de las actividades en la galería privada de cada salón.'],
                ],
            ],
            'schedule' => [
                'items' => [
                    ['label' => 'Guardería', 'hours' => 'Lunes a viernes · 7:30 a. m. – 5:00 p. m.'],
                    ['label' => 'Inicial 3, 4 y 5 años', 'hours' => 'Lunes a viernes · 8:15 a. m. – 12:45 p. m.'],
                    ['label' => 'Atención a padres', 'hours' => 'Lunes a viernes · 8:00 a. m. – 4:00 p. m.'],
                ],
            ],
            'team' => [
                'intro' => 'Un equipo de maestras y auxiliares que ama lo que hace.',
                'items' => [],
            ],
            'testimonials' => [
                'items' => [
                    ['name' => 'Mamá de Sofía', 'relation' => 'Salón Patitos', 'text' => 'Mi hija entra feliz todos los días. Las maestras son muy cariñosas y siempre nos mantienen informados.'],
                    ['name' => 'Papá de Mateo', 'relation' => 'Salón Leoncitos', 'text' => 'Se nota el avance en lectura y autonomía. Llegó muy preparado a primer grado.'],
                    ['name' => 'Mamá de Valentina', 'relation' => 'Guardería', 'text' => 'Me da mucha tranquilidad dejarla aquí mientras trabajo; la cuidan como en casa.'],
                ],
            ],
            'contact' => [
                'phone' => null,
                'email' => null,
                'address' => null,
                'hours' => 'Lunes a viernes de 8:00 a. m. a 4:00 p. m.',
                'map_query' => 'EP Villa Jardín, Ica, Perú',
                'facebook' => null,
                'instagram' => null,
                'tiktok' => null,
                'youtube' => null,
            ],
            'admission' => [
                'open' => true,
                'title' => 'Admisión',
                'text' => 'Déjanos tus datos y te contactaremos para agendar una visita guiada, resolver tus dudas y contarte sobre vacantes y pensiones.',
                'steps' => ['Completa el formulario o escríbenos por WhatsApp', 'Agenda una visita guiada con tu niño', 'Entrevista con la dirección', 'Matrícula y entrega de la lista de útiles'],
                'requirements' => ['Copia del DNI del niño y de los padres', 'Carné de vacunas actualizado', 'Partida de nacimiento', '2 fotos tamaño carné'],
            ],
        ];
    }
}
