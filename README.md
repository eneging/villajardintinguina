# EP Villa Jardín — Ica

Sitio web y plataforma de gestión para el colegio inicial y guardería **EP Villa Jardín** (Ica, Perú).

**Stack:** Laravel 13 · Inertia.js · React 19 + TypeScript · Tailwind · **MySQL / MariaDB** · Cloudinary — pensado para desplegarse en un **hosting compartido** (cPanel, PHP 8.3+).

- Arquitectura, módulos y plan por fases: [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)
- **Publicar en el hosting (cPanel):** [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)

## Qué hay implementado

- **Sitio público** de presentación para padres: Inicio, Nosotros (misión, visión, propuesta pedagógica, equipo), Servicios, Videos (lecciones de inducción marcadas como públicas), Fotos (álbumes públicos con autorización de imagen), Admisión y mapa de Google. Todo el texto, fotos, horarios, testimonios, redes sociales y datos de contacto se editan desde **Admin › Sitio web**.
- **Admisiones**: formulario de pre-inscripción que guarda la solicitud, avisa por correo y se sigue desde **Admin › Admisiones** (estados, notas, WhatsApp con mensaje listo).
- **Roles**: administradora, maestra, practicante, padre/madre, alumno. **Sin registro público**: las cuentas las crea la administración.
- **Salones** por nivel y año escolar, con maestras/practicantes asignadas y alumnos matriculados.
- **Módulos de aprendizaje**: la maestra publica en su salón qué aprenderán los niños (texto, imagen, video, PDF, actividad para casa). Los padres solo ven los publicados del salón de su hijo.
- **Inducción**: lecciones con video, imágenes y texto dirigidas a todos, a niveles o a salones (y al personal). Casilla de aceptación, avance por padre y tablero por salón con recordatorio por WhatsApp.
- **Libro de Reclamaciones Virtual** (INDECOPI): hoja con correlativo anual, constancia por correo e imprimible, plazo de 15 días hábiles (sin fines de semana ni feriados), respuesta de la administradora y aviso diario de plazos. Las hojas no se editan ni se borran.
- **Ficha del alumno** con foto, salud, asistencia del mes, apoderados, **personas autorizadas a recoger** (con DNI y foto; aparecen en la asistencia), estado de cuenta y documentos. Los padres tienen **Mis hijos** y pueden autorizar a otras personas.
- **Información del salón**: horario del día, menú semanal, lista de útiles y calendario de actividades, editables por la maestra.
- **Administración**: personas (cuentas y roles, activar/desactivar, enlace de acceso por correo), alumnos con apoderados y matrícula, salones con su personal.
- **Pagos y morosidad**: mensualidades automáticas (con descuento por alumno), matrícula y otros cobros; pagos en efectivo, transferencia, Yape, Plin o tarjeta que pueden cubrir varios meses; foto del voucher y de la boleta/factura; los padres reportan su pago con voucher y la administradora lo confirma o rechaza; panel de morosos con recordatorio por WhatsApp registrado, **recordatorio automático por correo** (y WhatsApp Cloud API si se configura) y **cargos masivos** por salón o para todo el colegio.
- **Asistencia**: alumnos por salón (presente, tardanza, falta, justificada; hora de llegada, salida y quién lo recogió), reporte mensual y calendario para los padres; marcación de entrada y salida del personal con tardanza automática y ubicación opcional, resumen mensual y registro manual de la administradora.
- **Planilla y balance**: trabajadores (planilla, honorarios o prácticas; ONP/AFP), planilla mensual calculada con la asistencia (faltas = sueldo ÷ 30, tardanzas opcionales), bonos y descuentos, aprobación, pago con voucher y boleta imprimible (el personal ve las suyas); gastos por categoría, otros ingresos (sorteos, eventos) y balance mensual con gráfico de 12 meses y exportación a Excel.
- **Eventos y sorteos**: eventos con tema festivo y formulario personalizable (respuestas exportables), sorteos con tickets numerados y sorteo en vivo verificable; lo recaudado entra al balance.
- **Documentos** del colegio, de alumnos y del personal, con permisos, enlace temporal y avisos de vencimiento.
- **Comunicados** generales o por salón, reenviables por WhatsApp.
- **Galería privada por salón**: álbumes de fotos y videos (subida múltiple a Cloudinary), visibles solo para las familias y el personal del salón; publicar exige confirmar la autorización de imagen (se avisa qué niños no la tienen); visor a pantalla completa y descarga.
- **Configuración**: años escolares (crear el siguiente copiando salones, personal e inducciones, y activarlo), niveles, categorías de gastos y **respaldos** de la base de datos.
- **Auditoría**: historial inmutable de quién creó, cambió o eliminó pagos, cuotas, planilla, gastos, matrículas y reclamos.
- **Notificaciones** (campanita): comunicados, módulos, fotos, eventos, pagos confirmados u observados, vouchers por verificar, admisiones y reclamos.
- **Exportar a Excel**: alumnos, morosos, admisiones y balance mensual.
- **PWA**: la plataforma se instala en el celular como app (ícono, pantalla completa y aviso sin conexión).
- **Subida directa a Cloudinary** firmada por Laravel (archivos de salones e inducción con entrega `authenticated`).

## Desarrollo local

```bash
composer install
cp .env.example .env
php artisan key:generate
# Crea la base de datos MySQL/MariaDB (utf8mb4) y pon usuario y contraseña en .env (DB_*)
php artisan migrate --seed
npm install
composer dev                          # servidor + Vite
```

Usuarios de prueba (contraseña `password`), creados por `DemoSeeder` solo fuera de producción:

| Rol                         | Correo                       |
| --------------------------- | ---------------------------- |
| Administradora              | admin@villajardin.test       |
| Maestra (salón Patitos)     | maestra@villajardin.test     |
| Practicante (salón Patitos) | practicante@villajardin.test |
| Madre de Sofía (Patitos)    | padre@villajardin.test       |

### Datos del colegio

Completa en `.env` la razón social, RUC, dirección y correo (`SCHOOL_*`): aparecen en la Hoja de Reclamación y el correo recibe copia de cada reclamo. Los feriados están en `config/school.php`.

### Tareas programadas

En el hosting compartido configura un solo cron cada minuto: `php artisan schedule:run`. Ejecuta la generación de mensualidades el día 1 (`cuotas:generar`), el aviso diario de reclamos por vencer (`reclamos:alertar-plazos`), los documentos por vencer, el **respaldo diario** de la base de datos (`respaldo:crear`, 2:00 a. m.) y los **recordatorios a morosos** (`morosos:recordar`, lunes a viernes 9:00, solo si `AUTO_REMINDERS=true`; no repite antes de `REMINDER_INTERVAL_DAYS`). El día de vencimiento y la tolerancia se configuran con `SCHOOL_FEE_DUE_DAY` y `SCHOOL_GRACE_DAYS`.

### Cloudinary

En `.env`: `CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME` y `CLOUDINARY_FOLDER=villajardin/produccion`.
En la consola de Cloudinary activa _"Allow delivery of PDF and ZIP files"_. Sin Cloudinary configurado, los módulos aceptan texto, actividades y videos de YouTube.

## Pruebas

Las pruebas usan MySQL/MariaDB (base `villajardin_test`, el mismo motor del hosting). Créala con el mismo usuario de `.env`.

```bash
php artisan test
npm run types:check
npm run check
```
