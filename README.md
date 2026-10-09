# EP Villa Jardín — Ica

Sitio web y plataforma de gestión para el colegio inicial y guardería **EP Villa Jardín** (Ica, Perú).

**Stack:** Laravel 13 · Inertia.js · React 19 + TypeScript · Tailwind · MySQL · Cloudinary — pensado para desplegarse en un **hosting compartido** (cPanel, PHP 8.3+).

- Arquitectura, módulos y plan por fases: [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)

## Qué hay implementado

- **Sitio público** de presentación para padres (niveles, diferenciadores, contacto por WhatsApp).
- **Roles**: administradora, maestra, practicante, padre/madre, alumno (tabla `role_user`).
- **Salones** por nivel y año escolar, con maestras/practicantes asignadas y alumnos matriculados.
- **Módulos de aprendizaje**: la maestra publica en su salón qué aprenderán los niños, con bloques de texto, imagen, video (Cloudinary o YouTube), PDF y actividades para casa. Los padres solo ven los publicados del salón de su hijo.
- **Subida directa a Cloudinary** firmada por Laravel (los archivos de salones se entregan como `authenticated`).

## Desarrollo local

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite        # o configura MySQL en .env
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

### Cloudinary

En `.env`: `CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME` y `CLOUDINARY_FOLDER=villajardin/produccion`.
En la consola de Cloudinary activa _"Allow delivery of PDF and ZIP files"_. Sin Cloudinary configurado, los módulos aceptan texto, actividades y videos de YouTube.

## Pruebas

```bash
php artisan test
npm run types:check
npm run check
```
