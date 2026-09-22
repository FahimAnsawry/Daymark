<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DemoTaskController;
use App\Http\Controllers\Api\HealthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider or bootstrap/app.php
| and assigned the "api" middleware group.
|
*/

// API Root and Diagnostics
Route::get('/', function () {
    return response()->json([
        'status' => 'online',
        'message' => 'Laravel React API is running',
        'version' => '1.0.0',
        'endpoints' => [
            'health' => url('/api/health'),
            'tasks' => url('/api/tasks'),
            'auth' => [
                'register' => url('/api/auth/register'),
                'login' => url('/api/auth/login'),
                'me' => url('/api/auth/me'),
            ],
        ],
    ]);
});
Route::get('/health', HealthController::class);

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Socialite OAuth Routes
    Route::get('/{provider}/redirect', [AuthController::class, 'redirectToProvider']);
    Route::match(['get', 'post'], '/{provider}/callback', [AuthController::class, 'handleProviderCallback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Authenticated User Route
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Demo Tasks API (for TanStack Query demonstration)
Route::prefix('tasks')->group(function () {
    Route::get('/', [DemoTaskController::class, 'index']);
    Route::post('/', [DemoTaskController::class, 'store']);
    Route::patch('/{id}/toggle', [DemoTaskController::class, 'toggle']);
    Route::delete('/{id}', [DemoTaskController::class, 'destroy']);
});
