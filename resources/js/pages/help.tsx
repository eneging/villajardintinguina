import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { cn } from '@/lib/utils';
import { help } from '@/routes';
import type { Role } from '@/types';

type Guide = { question: string; steps: string[] };
type Section = {
    role: Role;
    label: string;
    intro: string;
    start?: string[];
    guides: Guide[];
};

const sections: Section[] = [
    {
        role: 'admin',
        label: 'Administradora',
        intro: 'Todo lo del colegio: personas, salones, pagos, planilla, sitio web y configuración.',
        start: [
            'Configuración: revisa el año escolar activo, los niveles y las categorías de gastos. Crea los trimestres en «Periodos de evaluación».',
            'Personas: crea las cuentas de las maestras y practicantes (rol Maestra o Practicante).',
            'Salones: entra a cada salón con «Editar salón» y asigna la maestra titular, auxiliar y practicantes.',
            'Alumnos › Importar desde Excel: descarga la plantilla, llénala y súbela. Marca «Enviar correo de acceso» para que los padres creen su contraseña.',
            'Pagos: pulsa «Generar mensualidades» cada mes (se hace sola el día 1 si el cron está activo). Agrega servicios como movilidad o almuerzo en Servicios.',
            'Sitio web: cambia textos, fotos, horarios, testimonios, redes sociales y la política de privacidad.',
            'Visitas guiadas: abre horarios para que las familias reserven desde la web.',
        ],
        guides: [
            {
                question: '¿Cómo registro un pago?',
                steps: [
                    'Pagos › busca al alumno › «Registrar pago».',
                    'Elige las cuotas, la modalidad (efectivo, Yape, transferencia…), el monto y el N° de operación.',
                    'Sube la foto de la boleta o factura. La familia la verá en «Mis pagos».',
                ],
            },
            {
                question: '¿Cómo reviso un voucher que subió un padre?',
                steps: [
                    'En el inicio verás «Vouchers por verificar».',
                    'Pagos › pendientes: revisa la foto y pulsa Confirmar o Rechazar (con el motivo). La familia recibe el aviso.',
                ],
            },
            {
                question: '¿Cómo recuerdo a los morosos?',
                steps: [
                    'Pagos › Morosos.',
                    'Botón de WhatsApp para cada familia (mensaje listo), o «Recordar a todos» para enviar el correo a todas.',
                    'También puedes exportar la lista a Excel.',
                ],
            },
            {
                question: '¿Cómo apruebo una matrícula en línea?',
                steps: [
                    'Matrículas en línea › abre la solicitud.',
                    'Revisa los datos y documentos. Elige el salón y la mensualidad y pulsa «Aprobar y matricular».',
                    'Si falta algo, usa «Pedir corrección a la familia» con el motivo.',
                ],
            },
            {
                question: '¿Cómo hago la planilla del mes?',
                steps: [
                    'Trabajadores: registra a cada persona con su sueldo y régimen.',
                    'Planilla › Generar: se calculan faltas con la asistencia.',
                    'Ajusta bonos o descuentos, aprueba, registra el pago e imprime la boleta.',
                ],
            },
            {
                question: '¿Cómo publico las libretas?',
                steps: [
                    'Las maestras califican en su salón › Libretas.',
                    'Configuración › Periodos de evaluación › «Publicar libretas». Las familias reciben el aviso.',
                ],
            },
            {
                question: '¿Cómo respondo un reclamo?',
                steps: [
                    'Libro de Reclamaciones › abre la hoja.',
                    'Escribe la respuesta. Se envía por correo al consumidor. El plazo legal es de 15 días hábiles.',
                ],
            },
            {
                question: '¿Dónde descargo un respaldo?',
                steps: [
                    'Configuración › Respaldos de la base de datos › Descargar.',
                    'Guarda uno al mes en tu Google Drive.',
                ],
            },
        ],
    },
    {
        role: 'teacher',
        label: 'Maestras',
        intro: 'Tu salón desde el celular: asistencia, cuaderno diario, módulos, fotos, libretas y mensajes con las familias.',
        guides: [
            {
                question: '¿Cómo tomo la asistencia?',
                steps: [
                    'Salones › tu salón › Asistencia.',
                    'Pulsa «Marcar el resto como presentes» y corrige a quien faltó o llegó tarde.',
                    'Al salir, anota quién recogió a cada niño. Pulsa «Guardar asistencia».',
                ],
            },
            {
                question: '¿Cómo entrego a un niño con el código QR?',
                steps: [
                    'Escanea con la cámara del celular el código que muestra la persona.',
                    'Se abre la plataforma con su nombre, parentesco y DNI. Compáralo con su documento.',
                    'Pulsa «Entregar». Queda la hora y la familia recibe el aviso.',
                ],
            },
            {
                question: '¿Cómo lleno el cuaderno diario?',
                steps: [
                    'Tu salón › Cuaderno diario › toca al niño.',
                    'Marca ánimo, comidas, siesta y pañal o baño. Escribe un mensaje y lo que necesita traer.',
                    '«Enviar a la familia» les llega como notificación. «Guardar borrador» si aún no terminas.',
                ],
            },
            {
                question: '¿Cómo publico un módulo de aprendizaje?',
                steps: [
                    'Tu salón › Nuevo módulo.',
                    'Escribe el título, el área, las fechas y los logros. Agrega textos, fotos, videos o una actividad para casa.',
                    'Estado «Publicado» para que lo vean los padres.',
                ],
            },
            {
                question: '¿Cómo subo fotos de una actividad?',
                steps: [
                    'Tu salón › Galería › Nuevo álbum.',
                    'Sube varias fotos o videos a la vez.',
                    'Revisa que solo salgan niños con autorización de imagen (la lista de quienes no la tienen aparece arriba) y pulsa Publicar.',
                ],
            },
            {
                question: '¿Cómo califico la libreta?',
                steps: [
                    'Tu salón › Libretas › elige el trimestre.',
                    'Calificar: marca AD, A, B o C en cada competencia. En B o C escribe la conclusión descriptiva.',
                    'Agrega tu comentario y guarda. La administradora la publica.',
                ],
            },
            {
                question: '¿Cómo registro un incidente?',
                steps: [
                    'Incidentes › Registrar incidente.',
                    'Elige al niño, el tipo y qué pasó y qué se hizo. Si se dio medicina, anota cuál y la dosis.',
                    'La familia recibe el aviso al momento.',
                ],
            },
            {
                question: '¿Cómo marco mi entrada y salida?',
                steps: [
                    'Mi asistencia › Marcar entrada al llegar y Marcar salida al irte.',
                    'Se usa la hora del servidor; las tardanzas se calculan solas.',
                ],
            },
        ],
    },
    {
        role: 'intern',
        label: 'Practicantes',
        intro: 'Apoyas en el salón: asistencia, cuaderno diario, entrega de niños e incidentes.',
        guides: [
            {
                question: '¿Qué puedo hacer en la plataforma?',
                steps: [
                    'Ver tu salón, tomar asistencia y llenar el cuaderno diario.',
                    'Entregar niños con el código QR y registrar incidentes.',
                    'Marcar tu entrada y salida en «Mi asistencia» y completar tu inducción.',
                ],
            },
        ],
    },
    {
        role: 'parent',
        label: 'Familias',
        intro: 'Todo sobre tu hijo: su día, el salón, pagos, fotos, libretas y mensajes con la maestra.',
        start: [
            'Revisa el correo que te enviamos y crea tu contraseña.',
            'Completa tu inducción (videos cortos sobre cómo trabajamos).',
            'En «Mis hijos» revisa la ficha y agrega a las personas autorizadas a recoger a tu hijo.',
            'Instala la plataforma en tu celular: en el navegador, menú › «Agregar a la pantalla de inicio».',
        ],
        guides: [
            {
                question: '¿Cómo veo cómo le fue a mi hijo hoy?',
                steps: [
                    'Cuaderno diario: cómo comió, durmió y se sintió, con foto del día.',
                    'Te llega una notificación cuando la maestra lo envía.',
                ],
            },
            {
                question: '¿Cómo pago la pensión con Yape o transferencia?',
                steps: [
                    'Paga por Yape o transferencia a las cuentas del colegio.',
                    'Mis pagos › «Reportar pago»: elige el mes, escribe el N° de operación y sube la captura.',
                    'La dirección lo confirma y verás tu boleta en «Mis pagos».',
                ],
            },
            {
                question: '¿Cómo autorizo a alguien a recoger a mi hijo?',
                steps: [
                    'Mis hijos › tu hijo › «Autorizar a otra persona» con su nombre, DNI y parentesco.',
                    'Abajo aparece su código QR: envíaselo para que lo muestre al recoger.',
                ],
            },
            {
                question: '¿Cómo le escribo a la maestra?',
                steps: [
                    'Mensajes › elige a tu hijo y escribe. Lo ven la maestra y el personal del salón.',
                    'Te avisamos cuando te respondan.',
                ],
            },
            {
                question: '¿Dónde veo la libreta de notas?',
                steps: [
                    'Libretas de notas › elige el trimestre.',
                    'Puedes imprimirla o guardarla en PDF.',
                ],
            },
            {
                question: '¿Cómo matriculo a mi hijo para el próximo año?',
                steps: [
                    'Matrícula › «Re-matricular» (o «Matricular a un nuevo hijo»).',
                    'Revisa los datos, sube los documentos y acepta el reglamento. Te avisaremos cuando se apruebe.',
                ],
            },
        ],
    },
];

export default function Help() {
    const { auth } = usePage().props;
    const visible = sections.filter(
        (section) =>
            auth.roles.includes('admin') || auth.roles.includes(section.role),
    );
    const [active, setActive] = useState<Role>(visible[0]?.role ?? 'parent');
    const section = visible.find((s) => s.role === active) ?? visible[0];

    return (
        <>
            <Head title="Ayuda" />
            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
                <Heading
                    title="Ayuda"
                    description="Guías cortas para usar la plataforma. ¿Algo no está aquí? Escríbele a la dirección."
                />

                {visible.length > 1 && (
                    <div
                        role="tablist"
                        className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1"
                    >
                        {visible.map((item) => (
                            <button
                                key={item.role}
                                type="button"
                                role="tab"
                                aria-selected={active === item.role}
                                onClick={() => setActive(item.role)}
                                className={cn(
                                    'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium',
                                    active === item.role
                                        ? 'bg-background shadow-sm'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}

                {section && (
                    <div className="space-y-5">
                        <p className="text-muted-foreground">{section.intro}</p>
                        {section.start && (
                            <section className="space-y-2 rounded-2xl border border-green-200 bg-green-50/60 p-5 dark:border-green-900 dark:bg-green-950/20">
                                <h2 className="font-semibold">Para empezar</h2>
                                <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                                    {section.start.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ol>
                            </section>
                        )}
                        <div className="divide-y rounded-2xl border bg-card">
                            {section.guides.map((guide) => (
                                <details
                                    key={guide.question}
                                    className="group p-4"
                                >
                                    <summary className="cursor-pointer font-medium marker:text-muted-foreground">
                                        {guide.question}
                                    </summary>
                                    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                                        {guide.steps.map((step) => (
                                            <li key={step}>{step}</li>
                                        ))}
                                    </ol>
                                </details>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

Help.layout = { breadcrumbs: [{ title: 'Ayuda', href: help() }] };
