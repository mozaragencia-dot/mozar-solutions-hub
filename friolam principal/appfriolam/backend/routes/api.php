<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TechnicianServiceController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/technician/services', [TechnicianServiceController::class, 'myServices']);
    Route::put('/technician/services/{service}/form', [TechnicianServiceController::class, 'updateForm']);

    // Cambio de estado por body (sin depender de id en URL)
    Route::post('/technician/services/change-status', [TechnicianServiceController::class, 'changeStatus']);
});
