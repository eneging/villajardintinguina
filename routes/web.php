<?php

use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\ClassroomController as AdminClassroomController;
use App\Http\Controllers\Admin\ComplaintController as AdminComplaintController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InductionController;
use App\Http\Controllers\LearningModuleController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\Parent\PaymentController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

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

    // Salones y módulos de aprendizaje (las Policies deciden qué ve cada rol).
    Route::get('salones', [ClassroomController::class, 'index'])
        ->middleware('role:admin,teacher')
        ->name('classrooms.index');
    Route::get('salones/{classroom}', [ClassroomController::class, 'show'])->name('classrooms.show');

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
        Route::get('alumnos/crear', [StudentController::class, 'create'])->name('students.create');
        Route::post('alumnos', [StudentController::class, 'store'])->name('students.store');
        Route::get('alumnos/{student}/editar', [StudentController::class, 'edit'])->name('students.edit');
        Route::put('alumnos/{student}', [StudentController::class, 'update'])->name('students.update');

        Route::get('pagos', [BillingController::class, 'index'])->name('billing.index');
        Route::post('pagos/generar', [BillingController::class, 'generate'])->name('billing.generate');
        Route::post('pagos', [BillingController::class, 'storePayment'])->name('billing.payments.store');
        Route::post('pagos/{payment}/confirmar', [BillingController::class, 'confirm'])->name('billing.payments.confirm');
        Route::post('pagos/{payment}/rechazar', [BillingController::class, 'reject'])->name('billing.payments.reject');
        Route::get('pagos/alumno/{student}', [BillingController::class, 'student'])->name('billing.student');
        Route::post('pagos/alumno/{student}/cuotas', [BillingController::class, 'storeCharge'])->name('billing.charges.store');
        Route::post('cuotas/{charge}/anular', [BillingController::class, 'voidCharge'])->name('billing.charges.annul');
        Route::get('morosos', [BillingController::class, 'debtors'])->name('billing.debtors');
        Route::post('morosos/{user}/recordatorio', [BillingController::class, 'remind'])->name('billing.remind');

        Route::get('salones/crear', [AdminClassroomController::class, 'create'])->name('classrooms.create');
        Route::post('salones', [AdminClassroomController::class, 'store'])->name('classrooms.store');
        Route::get('salones/{classroom}/editar', [AdminClassroomController::class, 'edit'])->name('classrooms.edit');
        Route::put('salones/{classroom}', [AdminClassroomController::class, 'update'])->name('classrooms.update');

        Route::get('reclamos', [AdminComplaintController::class, 'index'])->name('complaints.index');
        Route::get('reclamos/{complaint}', [AdminComplaintController::class, 'show'])->name('complaints.show');
        Route::post('reclamos/{complaint}/respuesta', [AdminComplaintController::class, 'respond'])->name('complaints.respond');
    });

    // Padres: estado de cuenta y reporte de pagos con voucher.
    Route::middleware('role:parent')->group(function () {
        Route::get('mis-pagos', [PaymentController::class, 'index'])->name('payments.index');
        Route::post('mis-pagos', [PaymentController::class, 'store'])
            ->middleware('throttle:20,1')
            ->name('payments.store');
    });

    // Cloudinary: firma de subida directa y registro del archivo subido.
    Route::post('media/firma', [MediaController::class, 'signature'])
        ->middleware('throttle:60,1')
        ->name('media.signature');
    Route::post('media', [MediaController::class, 'store'])->name('media.store');
});

require __DIR__.'/settings.php';
