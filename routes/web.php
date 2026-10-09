<?php

use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LearningModuleController;
use App\Http\Controllers\MediaController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

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

    // Cloudinary: firma de subida directa y registro del archivo subido.
    Route::post('media/firma', [MediaController::class, 'signature'])
        ->middleware('throttle:60,1')
        ->name('media.signature');
    Route::post('media', [MediaController::class, 'store'])->name('media.store');
});

require __DIR__.'/settings.php';
