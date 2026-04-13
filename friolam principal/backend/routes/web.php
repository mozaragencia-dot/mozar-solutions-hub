<?php

use App\Http\Controllers\Admin\ServiceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:admin,supervisor'])->prefix('admin')->group(function () {
    Route::get('/services', [ServiceController::class, 'index'])->name('admin.services.index');
    Route::get('/services/view/{service}', [ServiceController::class, 'view'])->name('admin.services.view');
});
