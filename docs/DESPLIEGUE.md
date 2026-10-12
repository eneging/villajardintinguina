# Guía de despliegue en hosting compartido (cPanel)

Esta guía publica **EP Villa Jardín** en un hosting compartido con cPanel, PHP y MySQL/MariaDB, **sin necesidad de SSH**. Si tu hosting tiene SSH, también sirve (y puedes ejecutar los comandos `php artisan …` directamente).

## 1. Requisitos del hosting

| Requisito                                                                                                                       | Dónde revisarlo en cPanel                 |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **PHP 8.3 o superior**                                                                                                          | _Select PHP Version_ / _MultiPHP Manager_ |
| Extensiones: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `fileinfo`, `bcmath`, `intl`, `curl`, `zip`, `gd` | _Select PHP Version → Extensions_         |
| **MySQL 8 o MariaDB 10.6+**                                                                                                     | _MySQL Databases_                         |
| Acceso **FTP**                                                                                                                  | _FTP Accounts_                            |
| **Cron jobs**                                                                                                                   | _Cron Jobs_                               |
| Certificado **SSL** (gratis)                                                                                                    | _SSL/TLS Status_ → _Run AutoSSL_          |

## 2. Base de datos

1. cPanel → **MySQL Databases** → crea la base `usuario_villajardin` (cotejamiento `utf8mb4_unicode_ci`).
2. Crea un usuario con contraseña segura y **agrégalo a la base con todos los privilegios**.

## 3. Elige cómo servir la carpeta pública

Laravel solo debe exponer la carpeta `public`. El resto del proyecto **no** debe quedar accesible desde la web.

- **Opción A (recomendada):** sube el proyecto a `/home/USUARIO/villajardin/` y en cPanel → **Domains** cambia la _Document Root_ del dominio a `villajardin/public`.
- **Opción B (si el hosting obliga a usar `public_html`):** sube el proyecto a `/home/USUARIO/villajardin/` y el contenido de `public/` a `public_html/`, reemplazando `public_html/index.php` por [`deploy/public_html/index.php`](../deploy/public_html/index.php) (archivo puente que ya apunta a `../villajardin`). El flujo de GitHub lo hace solo si defines `FTP_PUBLIC_DIR`.

## 4. Archivo `.env` en el servidor

Con el **Administrador de archivos** de cPanel crea `/home/USUARIO/villajardin/.env` copiando [`.env.example`](../.env.example) y completa como mínimo:

```dotenv
APP_NAME="EP Villa Jardín"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tu-dominio.pe
APP_KEY=            # genera una con: php artisan key:generate --show (en tu PC)

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=usuario_villajardin
DB_USERNAME=usuario_villajardin
DB_PASSWORD=********

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync

# Correo del hosting (cPanel → Email Accounts → Connect Devices)
MAIL_MAILER=smtp
MAIL_HOST=mail.tu-dominio.pe
MAIL_PORT=465
MAIL_SCHEME=smtps
MAIL_USERNAME=no-responder@tu-dominio.pe
MAIL_PASSWORD=********
MAIL_FROM_ADDRESS=no-responder@tu-dominio.pe

# Cloudinary (Settings → API Keys)
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CLOUDINARY_FOLDER=villajardin/produccion

# Datos del colegio (Libro de Reclamaciones, boletas)
SCHOOL_LEGAL_NAME="Razón social S.A.C."
SCHOOL_RUC=20XXXXXXXXX
SCHOOL_ADDRESS="Av. … , Ica"
SCHOOL_EMAIL=administracion@tu-dominio.pe
SCHOOL_WHATSAPP=51987654321

# Despliegue sin SSH
DEPLOY_TOKEN=una-cadena-larga-y-aleatoria
INSTALL_ADMIN_EMAIL=directora@tu-dominio.pe
INSTALL_ADMIN_NAME="Nombre de la directora"
```

> Para `APP_KEY` y `DEPLOY_TOKEN` usa valores largos y secretos. Nunca subas el `.env` a GitHub.

## 5. Publicación automática desde GitHub

En GitHub → **Settings → Secrets and variables → Actions** crea estos secretos:

| Secreto                         | Ejemplo                        |
| ------------------------------- | ------------------------------ |
| `FTP_SERVER`                    | `ftp.tu-dominio.pe`            |
| `FTP_USERNAME` / `FTP_PASSWORD` | cuenta FTP de cPanel           |
| `FTP_APP_DIR`                   | `/villajardin/`                |
| `FTP_PUBLIC_DIR`                | solo opción B: `/public_html/` |
| `APP_URL`                       | `https://tu-dominio.pe`        |
| `DEPLOY_TOKEN`                  | el mismo valor del `.env`      |

Cada cambio en la rama `main` (o _Actions → deploy → Run workflow_) hace:

1. Instala dependencias de PHP de producción y **compila el frontend** (el hosting no necesita Node).
2. Sube los archivos por FTP (la primera vez tarda porque sube `vendor/`; luego solo sube lo que cambió).
3. Llama a `POST /_deploy` con el token: ejecuta **migraciones**, `escuela:instalar` (estructura del colegio y **primera administradora**, que recibe un correo para crear su contraseña) y regenera las **cachés**.

## 6. Tarea programada (cron)

cPanel → **Cron Jobs** → _Once Per Minute_ (`* * * * *`):

```bash
/usr/local/bin/php /home/USUARIO/villajardin/artisan schedule:run >> /dev/null 2>&1
```

(La ruta de PHP puede variar; cPanel la muestra en _Cron Jobs_. Debe ser PHP 8.3.)

Esto ejecuta automáticamente:

| Tarea                                                     | Cuándo                 |
| --------------------------------------------------------- | ---------------------- |
| `cuotas:generar` – mensualidades del mes                  | día 1, 00:10           |
| `reclamos:alertar-plazos` – reclamos por vencer           | lunes a viernes, 08:00 |
| `documentos:alertar-vencimientos` – documentos por vencer | lunes, 08:15           |

## 7. Permisos de carpetas

`storage/` y `bootstrap/cache/` deben poder escribirse (permisos `755` en carpetas; en la mayoría de hostings ya funciona así).

## 8. Primera vez: lista de comprobación

- [ ] Abre `https://tu-dominio.pe` y verifica el sitio público.
- [ ] Revisa el correo de `INSTALL_ADMIN_EMAIL`, crea la contraseña e inicia sesión.
- [ ] Borra `INSTALL_ADMIN_PASSWORD` del `.env` si lo usaste.
- [ ] En la plataforma: **Salones** (ajusta nombres y asigna maestras), **Personas** (crea cuentas), **Alumnos** (matrículas), **Trabajadores** (planilla).
- [ ] Prueba subir una imagen en un módulo (confirma Cloudinary) y un reclamo (confirma el correo).
- [ ] En Cloudinary activa _Settings → Security → Allow delivery of PDF and ZIP files_.

## 9. Copias de seguridad

- cPanel → **Backup** → descarga semanal de la base de datos.
- Los archivos (fotos, videos, vouchers, documentos) viven en Cloudinary; exporta periódicamente la carpeta `villajardin/produccion` desde su consola.

## Solución de problemas

| Síntoma                                  | Causa probable                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Error 500 en blanco                      | Revisa `storage/logs/laravel.log`; suele ser `.env` incompleto o versión de PHP menor a 8.3 |
| Se ve el listado de archivos o el `.env` | La _Document Root_ no apunta a `public` (ver paso 3)                                        |
| La página carga sin estilos              | No se subió `public/build` (revisa el paso de FTP)                                          |
| No llegan correos                        | Datos SMTP del paso 4; prueba con el enlace de "¿Olvidaste tu contraseña?"                  |
| `POST /_deploy` responde 404             | `DEPLOY_TOKEN` vacío o distinto en `.env` y en GitHub                                       |
