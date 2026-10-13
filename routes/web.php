<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\ClassroomController as AdminClassroomController;
use App\Http\Controllers\Admin\ComplaintController as AdminComplaintController;
use App\Http\Controllers\Admin\DocumentController as AdminDocumentController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\FinanceController;
use App\Http\Controllers\Admin\LeadController;
use App\Http\Controllers\Admin\PayrollController;
use App\Http\Controllers\Admin\RaffleController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\SiteContentController;
use App\Http\Controllers\Admin\StaffAttendanceController as AdminStaffAttendanceController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\ClassroomInfoController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeployController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\InductionController;
use App\Http\Controllers\LearningModuleController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Parent\PaymentController;
use App\Http\Controllers\PayslipController;
use App\Http\Controllers\Public\SiteController;
use App\Http\Controllers\StaffAttendanceController;
use App\Http\Controllers\StudentAttendanceController;
use App\Http\Controllers\StudentProfileController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

// Sitio público para las familias (contenido editable desde Admin › Sitio web).
Route::get('/', [SiteController::class, 'home'])->name('home');
Route::get('nosotros', [SiteController::class, 'about'])->name('about');
Route::get('servicios', [SiteController::class, 'services'])->name('services');
Route::get('videos', [SiteController::class, 'videos'])->name('videos');
Route::get('videos/{lesson}', [SiteController::class, 'video'])->name('videos.show');
Route::get('fotos', [SiteController::class, 'gallery'])->name('photos');
Route::get('fotos/{album}', [SiteController::class, 'album'])->name('photos.show');
Route::get('admision', [SiteController::class, 'admission'])->name('admission');
Route::post('admision', [SiteController::class, 'storeLead'])
    ->middleware('throttle:5,10')
    ->name('admission.store');

// Tareas de despliegue en hosting sin SSH (protegido por DEPLOY_TOKEN).
Route::post('_deploy', DeployController::class)
    ->withoutMiddleware(ValidateCsrfToken::class)
    ->middleware('throttle:5,1')
    ->name('deploy');

// Libro de Reclamaciones Virtual (público, obligatorio por INDECOPI).
Route::get('libro-de-reclamaciones', [ComplaintController::class, 'create'])->name('complaints.create');
Route::post('libro-de-reclamaciones', [ComplaintController::class, 'store'])
    ->middleware('throttle:5,10')
    ->name('complaints.store');
Route::get('libro-de-reclamaciones/constancia/{complaint}', [ComplaintController::class, 'receipt'])
    ->middleware('signed')
    ->name('complaints.receipt');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('notificaciones', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('notificaciones/{notification}', [NotificationController::class, 'open'])->name('notifications.open');
    Route::post('notificaciones/leidas', [NotificationController::class, 'readAll'])->name('notifications.read-all');

    // Salones y módulos de aprendizaje (las Policies deciden qué ve cada rol).
    Route::get('salones', [ClassroomController::class, 'index'])
        ->middleware('role:admin,teacher')
        ->name('classrooms.index');
    Route::get('salones/{classroom}', [ClassroomController::class, 'show'])->name('classrooms.show');
    Route::get('salones/{classroom}/informacion', [ClassroomInfoController::class, 'edit'])->name('classrooms.info.edit');
    Route::put('salones/{classroom}/informacion', [ClassroomInfoController::class, 'update'])->name('classrooms.info.update');
    Route::post('salones/{classroom}/actividades', [ClassroomInfoController::class, 'storeActivity'])->name('classrooms.activities.store');
    Route::delete('actividades/{activity}', [ClassroomInfoController::class, 'destroyActivity'])->name('classrooms.activities.destroy');

    Route::get('salones/{classroom}/modulos/crear', [LearningModuleController::class, 'create'])->name('modules.create');
    Route::post('salones/{classroom}/modulos', [LearningModuleController::class, 'store'])->name('modules.store');
    Route::get('modulos/{module}', [LearningModuleController::class, 'show'])->name('modules.show');
    Route::get('modulos/{module}/editar', [LearningModuleController::class, 'edit'])->name('modules.edit');
    Route::put('modulos/{module}', [LearningModuleController::class, 'update'])->name('modules.update');
    Route::delete('modulos/{module}', [LearningModuleController::class, 'destroy'])->name('modules.destroy');

    // Inducción: lecciones con video, imágenes y texto (general, por nivel o por salón).
    Route::get('induccion', [InductionController::class, 'mine'])->name('induction.mine');
    Route::middleware('role:admin,teacher')->group(function () {
        Route::get('induccion/gestionar', [InductionController::class, 'index'])->name('induction.index');
        Route::get('induccion/crear', [InductionController::class, 'create'])->name('induction.create');
        Route::post('induccion', [InductionController::class, 'store'])->name('induction.store');
        Route::get('induccion/{lesson}/editar', [InductionController::class, 'edit'])->name('induction.edit');
        Route::put('induccion/{lesson}', [InductionController::class, 'update'])->name('induction.update');
        Route::delete('induccion/{lesson}', [InductionController::class, 'destroy'])->name('induction.destroy');
    });
    Route::get('induccion/{lesson}', [InductionController::class, 'show'])->name('induction.show');
    Route::post('induccion/{lesson}/completar', [InductionController::class, 'complete'])->name('induction.complete');
    Route::get('salones/{classroom}/induccion', [InductionController::class, 'classroomProgress'])->name('induction.progress');

    // Administración: personas, alumnos, salones y Libro de Reclamaciones.
    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('personas', [UserController::class, 'index'])->name('users.index');
        Route::get('personas/crear', [UserController::class, 'create'])->name('users.create');
        Route::post('personas', [UserController::class, 'store'])->name('users.store');
        Route::get('personas/{user}/editar', [UserController::class, 'edit'])->name('users.edit');
        Route::put('personas/{user}', [UserController::class, 'update'])->name('users.update');
        Route::post('personas/{user}/acceso', [UserController::class, 'sendAccess'])
            ->middleware('throttle:10,1')
            ->name('users.access');

        Route::get('alumnos', [StudentController::class, 'index'])->name('students.index');
        Route::get('alumnos/exportar', [StudentController::class, 'export'])->name('students.download');
        Route::get('alumnos/crear', [StudentController::class, 'create'])->name('students.create');
        Route::post('alumnos', [StudentController::class, 'store'])->name('students.store');
        Route::get('alumnos/{student}/editar', [StudentController::class, 'edit'])->name('students.edit');
        Route::put('alumnos/{student}', [StudentController::class, 'update'])->name('students.update');

        Route::get('pagos', [BillingController::class, 'index'])->name('billing.index');
        Route::post('pagos/generar', [BillingController::class, 'generate'])->name('billing.generate');
        Route::post('pagos/cargos', [BillingController::class, 'storeBulkCharge'])->name('billing.charges.bulk');
        Route::post('pagos', [BillingController::class, 'storePayment'])->name('billing.payments.store');
        Route::post('pagos/{payment}/confirmar', [BillingController::class, 'confirm'])->name('billing.payments.confirm');
        Route::post('pagos/{payment}/rechazar', [BillingController::class, 'reject'])->name('billing.payments.reject');
        Route::get('pagos/alumno/{student}', [BillingController::class, 'student'])->name('billing.student');
        Route::post('pagos/alumno/{student}/cuotas', [BillingController::class, 'storeCharge'])->name('billing.charges.store');
        Route::post('cuotas/{charge}/anular', [BillingController::class, 'voidCharge'])->name('billing.charges.annul');
        Route::get('morosos', [BillingController::class, 'debtors'])->name('billing.debtors');
        Route::get('morosos/exportar', [BillingController::class, 'exportDebtors'])->name('billing.debtors.download');
        Route::post('morosos/recordatorios', [BillingController::class, 'remindAll'])->middleware('throttle:3,1')->name('billing.remind-all');
        Route::post('morosos/{user}/recordatorio', [BillingController::class, 'remind'])->name('billing.remind');

        Route::get('asistencia-personal', [AdminStaffAttendanceController::class, 'index'])->name('staff-attendance.index');
        Route::post('asistencia-personal', [AdminStaffAttendanceController::class, 'store'])->name('staff-attendance.store');

        Route::get('trabajadores', [EmployeeController::class, 'index'])->name('employees.index');
        Route::get('trabajadores/crear', [EmployeeController::class, 'create'])->name('employees.create');
        Route::post('trabajadores', [EmployeeController::class, 'store'])->name('employees.store');
        Route::get('trabajadores/{employee}/editar', [EmployeeController::class, 'edit'])->name('employees.edit');
        Route::put('trabajadores/{employee}', [EmployeeController::class, 'update'])->name('employees.update');

        Route::get('planilla', [PayrollController::class, 'index'])->name('payroll.index');
        Route::post('planilla', [PayrollController::class, 'generate'])->name('payroll.generate');
        Route::get('planilla/{run}', [PayrollController::class, 'show'])->name('payroll.show');
        Route::post('planilla/{run}/aprobar', [PayrollController::class, 'approve'])->name('payroll.approve');
        Route::put('planilla/items/{item}', [PayrollController::class, 'updateItem'])->name('payroll.items.update');
        Route::post('planilla/items/{item}/pago', [PayrollController::class, 'pay'])->name('payroll.items.pay');
        Route::get('planilla/items/{item}/boleta', [PayrollController::class, 'slip'])->name('payroll.items.slip');

        Route::get('finanzas', [FinanceController::class, 'index'])->name('finance.index');
        Route::get('finanzas/exportar', [FinanceController::class, 'export'])->name('finance.download');
        Route::post('finanzas/gastos', [FinanceController::class, 'storeExpense'])->name('finance.expenses.store');
        Route::delete('finanzas/gastos/{expense}', [FinanceController::class, 'destroyExpense'])->name('finance.expenses.destroy');
        Route::post('finanzas/ingresos', [FinanceController::class, 'storeIncome'])->name('finance.incomes.store');
        Route::delete('finanzas/ingresos/{income}', [FinanceController::class, 'destroyIncome'])->name('finance.incomes.destroy');

        Route::get('eventos', [AdminEventController::class, 'index'])->name('events.index');
        Route::get('eventos/crear', [AdminEventController::class, 'create'])->name('events.create');
        Route::post('eventos', [AdminEventController::class, 'store'])->name('events.store');
        Route::get('eventos/{event}/editar', [AdminEventController::class, 'edit'])->name('events.edit');
        Route::put('eventos/{event}', [AdminEventController::class, 'update'])->name('events.update');
        Route::delete('eventos/{event}', [AdminEventController::class, 'destroy'])->name('events.destroy');
        Route::get('eventos/{event}/respuestas', [AdminEventController::class, 'submissions'])->name('events.submissions');
        Route::get('eventos/{event}/respuestas/descargar', [AdminEventController::class, 'download'])->name('events.download');

        Route::post('sorteos', [RaffleController::class, 'store'])->name('raffles.store');
        Route::get('sorteos/{raffle}', [RaffleController::class, 'show'])->name('raffles.show');
        Route::put('sorteos/{raffle}', [RaffleController::class, 'update'])->name('raffles.update');
        Route::delete('sorteos/{raffle}', [RaffleController::class, 'destroy'])->name('raffles.destroy');
        Route::put('sorteos/tickets/{ticket}', [RaffleController::class, 'assign'])->name('raffles.tickets.assign');
        Route::post('sorteos/{raffle}/sortear', [RaffleController::class, 'draw'])->name('raffles.draw');
        Route::get('sorteos/{raffle}/en-vivo', [RaffleController::class, 'live'])->name('raffles.live');

        Route::get('documentos', [AdminDocumentController::class, 'index'])->name('documents.index');
        Route::post('documentos', [AdminDocumentController::class, 'store'])->name('documents.store');
        Route::put('documentos/{document}', [AdminDocumentController::class, 'update'])->name('documents.update');
        Route::delete('documentos/{document}', [AdminDocumentController::class, 'destroy'])->name('documents.destroy');

        Route::get('salones/crear', [AdminClassroomController::class, 'create'])->name('classrooms.create');
        Route::post('salones', [AdminClassroomController::class, 'store'])->name('classrooms.store');
        Route::get('salones/{classroom}/editar', [AdminClassroomController::class, 'edit'])->name('classrooms.edit');
        Route::put('salones/{classroom}', [AdminClassroomController::class, 'update'])->name('classrooms.update');

        Route::get('auditoria', [AuditLogController::class, 'index'])->name('audit.index');

        Route::get('configuracion', [SettingsController::class, 'index'])->name('settings.index');
        Route::post('configuracion/respaldos', [SettingsController::class, 'storeBackup'])->middleware('throttle:3,1')->name('settings.backups.store');
        Route::get('configuracion/respaldos/{name}', [SettingsController::class, 'downloadBackup'])->name('settings.backups.download');
        Route::post('configuracion/anios', [SettingsController::class, 'storeYear'])->name('settings.years.store');
        Route::put('configuracion/anios/{year}', [SettingsController::class, 'updateYear'])->name('settings.years.update');
        Route::post('configuracion/anios/{year}/activar', [SettingsController::class, 'activateYear'])->name('settings.years.activate');
        Route::post('configuracion/niveles', [SettingsController::class, 'storeLevel'])->name('settings.levels.store');
        Route::put('configuracion/niveles/{level}', [SettingsController::class, 'updateLevel'])->name('settings.levels.update');
        Route::delete('configuracion/niveles/{level}', [SettingsController::class, 'destroyLevel'])->name('settings.levels.destroy');
        Route::post('configuracion/categorias', [SettingsController::class, 'storeCategory'])->name('settings.categories.store');
        Route::put('configuracion/categorias/{category}', [SettingsController::class, 'updateCategory'])->name('settings.categories.update');
        Route::delete('configuracion/categorias/{category}', [SettingsController::class, 'destroyCategory'])->name('settings.categories.destroy');

        Route::get('sitio-web', [SiteContentController::class, 'index'])->name('site.index');
        Route::put('sitio-web/{section}', [SiteContentController::class, 'update'])->name('site.update');

        Route::get('admisiones', [LeadController::class, 'index'])->name('leads.index');
        Route::get('admisiones/exportar', [LeadController::class, 'export'])->name('leads.download');
        Route::post('admisiones', [LeadController::class, 'store'])->name('leads.store');
        Route::put('admisiones/{lead}', [LeadController::class, 'update'])->name('leads.update');
        Route::delete('admisiones/{lead}', [LeadController::class, 'destroy'])->name('leads.destroy');

        Route::get('reclamos', [AdminComplaintController::class, 'index'])->name('complaints.index');
        Route::get('reclamos/{complaint}', [AdminComplaintController::class, 'show'])->name('complaints.show');
        Route::post('reclamos/{complaint}/respuesta', [AdminComplaintController::class, 'respond'])->name('complaints.respond');
    });

    // Asistencia de alumnos (personal del salón) y del personal (marcación propia).
    Route::get('salones/{classroom}/asistencia', [StudentAttendanceController::class, 'show'])->name('attendance.classroom');
    Route::post('salones/{classroom}/asistencia', [StudentAttendanceController::class, 'store'])->name('attendance.classroom.store');
    Route::get('salones/{classroom}/asistencia/reporte', [StudentAttendanceController::class, 'report'])->name('attendance.report');
    Route::get('asistencia', [StudentAttendanceController::class, 'mine'])->middleware('role:parent')->name('attendance.mine');
    Route::middleware('role:teacher,intern')->group(function () {
        Route::get('mi-asistencia', [StaffAttendanceController::class, 'index'])->name('attendance.staff');
        Route::post('mi-asistencia/entrada', [StaffAttendanceController::class, 'checkIn'])->middleware('throttle:10,1')->name('attendance.check-in');
        Route::post('mi-asistencia/salida', [StaffAttendanceController::class, 'checkOut'])->middleware('throttle:10,1')->name('attendance.check-out');
    });

    // Galería privada por salón.
    Route::get('salones/{classroom}/galeria', [GalleryController::class, 'index'])->name('gallery.index');
    Route::post('salones/{classroom}/galeria', [GalleryController::class, 'store'])->name('gallery.store');
    Route::get('galeria/{album}', [GalleryController::class, 'show'])->name('gallery.show');
    Route::put('galeria/{album}', [GalleryController::class, 'update'])->name('gallery.update');
    Route::post('galeria/{album}/publicar', [GalleryController::class, 'publish'])->name('gallery.publish');
    Route::post('galeria/{album}/sitio-web', [GalleryController::class, 'togglePublic'])->name('gallery.public');
    Route::delete('galeria/{album}', [GalleryController::class, 'destroy'])->name('gallery.destroy');
    Route::post('galeria/{album}/fotos', [GalleryController::class, 'addItems'])->name('gallery.items.store');
    Route::put('galeria/fotos/{item}', [GalleryController::class, 'updateItem'])->name('gallery.items.update');
    Route::delete('galeria/fotos/{item}', [GalleryController::class, 'destroyItem'])->name('gallery.items.destroy');

    // Comunicados generales y por salón.
    Route::get('comunicados', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::post('comunicados', [AnnouncementController::class, 'store'])->middleware('role:admin,teacher')->name('announcements.store');
    Route::put('comunicados/{announcement}', [AnnouncementController::class, 'update'])->name('announcements.update');
    Route::delete('comunicados/{announcement}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');

    // Eventos y fechas festivas (formularios y sorteos).
    Route::get('eventos', [EventController::class, 'index'])->name('events.index');
    Route::get('eventos/{event}', [EventController::class, 'show'])->name('events.show');
    Route::post('eventos/{event}/respuesta', [EventController::class, 'submit'])
        ->middleware('throttle:20,1')
        ->name('events.submit');

    // Documentos visibles para cada persona (se abren con enlace temporal).
    Route::get('documentos', [DocumentController::class, 'index'])->name('documents.index');
    Route::get('documentos/{document}/abrir', [DocumentController::class, 'open'])->name('documents.open');

    // Personal: sus boletas de pago.
    Route::get('mis-boletas', [PayslipController::class, 'index'])->name('payslips.index');
    Route::get('mis-boletas/{item}', [PayslipController::class, 'show'])->name('payslips.show');

    // Padres: estado de cuenta y reporte de pagos con voucher.
    Route::middleware('role:parent')->group(function () {
        Route::get('mis-pagos', [PaymentController::class, 'index'])->name('payments.index');
        Route::post('mis-pagos', [PaymentController::class, 'store'])
            ->middleware('throttle:20,1')
            ->name('payments.store');
    });

    // Fichas de alumnos: padres (Mis hijos), maestras del salón y administradora.
    Route::get('mis-hijos', [StudentProfileController::class, 'children'])->middleware('role:parent')->name('children.index');
    Route::get('alumnos/{student}', [StudentProfileController::class, 'show'])->name('students.show');
    Route::put('alumnos/{student}/foto', [StudentProfileController::class, 'updatePhoto'])->name('students.photo');
    Route::post('alumnos/{student}/autorizados', [StudentProfileController::class, 'storePickup'])->name('students.pickups.store');
    Route::delete('autorizados/{pickup}', [StudentProfileController::class, 'destroyPickup'])->name('students.pickups.destroy');

    // Cloudinary: firma de subida directa y registro del archivo subido.
    Route::post('media/firma', [MediaController::class, 'signature'])
        ->middleware('throttle:60,1')
        ->name('media.signature');
    Route::post('media', [MediaController::class, 'store'])->name('media.store');
});

require __DIR__.'/settings.php';
