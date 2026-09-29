<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\FocusSessionController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectInvitationController;
use App\Http\Controllers\Api\ProjectMemberController;
use App\Http\Controllers\Api\PushSubscriptionController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TaskImportController;
use App\Http\Controllers\Api\TaskReportController;
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
    Route::post('/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:5,1');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:10,1');

    // Socialite OAuth Routes
    Route::post('/google/demo', [AuthController::class, 'loginWithDemoGoogle']);
    Route::get('/{provider}/redirect', [AuthController::class, 'redirectToProvider']);
    Route::match(['get', 'post'], '/{provider}/callback', [AuthController::class, 'handleProviderCallback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'updatePassword']);
        Route::post('/avatar', [AuthController::class, 'updateAvatar']);
        Route::delete('/avatar', [AuthController::class, 'destroyAvatar']);
        Route::put('/preferences', [AuthController::class, 'updatePreferences']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Authenticated User Route
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Tasks, projects and completion reports (per user)
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('projects', ProjectController::class)->only(['index', 'store', 'destroy']);
    Route::post('/tasks/import', TaskImportController::class);
    Route::post('/tasks/{task}/complete', [TaskController::class, 'complete']);
    Route::post('/tasks/{task}/auto-complete', [TaskController::class, 'autoComplete']);
    Route::apiResource('tasks', TaskController::class)->except(['show']);
    Route::get('/reports/tasks', TaskReportController::class);

    // Browser notifications for reminders. Unsubscribing works on any plan.
    Route::get('/push/key', [PushSubscriptionController::class, 'key']);
    Route::delete('/push/subscriptions', [PushSubscriptionController::class, 'destroy']);

    Route::get('/billing', [BillingController::class, 'show']);
    Route::post('/billing/checkout', [BillingController::class, 'checkout']);
    Route::post('/billing/change', [BillingController::class, 'change']);
    Route::post('/billing/cancel', [BillingController::class, 'cancel']);
    Route::post('/billing/cancel-trial', [BillingController::class, 'cancelTrial']);

    // Sharing: anyone with access can see who's in a project; only Pro owners can invite.
    Route::get('/projects/{project}/members', [ProjectMemberController::class, 'index']);
    Route::delete('/projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy']);
    Route::delete('/projects/{project}/invitations/{invitation}', [ProjectInvitationController::class, 'destroy']);
    Route::get('/invitations/{token}', [ProjectInvitationController::class, 'show']);
    Route::post('/invitations/{token}/accept', [ProjectInvitationController::class, 'accept']);

    // Daymark Pro
    Route::middleware('plan:pro')->group(function () {
        Route::post('/projects/{project}/invitations', [ProjectInvitationController::class, 'store']);
    });

    // Daymark Plus
    Route::middleware('plan:plus')->group(function () {
        Route::post('/push/subscriptions', [PushSubscriptionController::class, 'store']);
        Route::get('/focus-sessions/current', [FocusSessionController::class, 'current']);
        Route::post('/focus-sessions', [FocusSessionController::class, 'store']);
        Route::patch('/focus-sessions/{focusSession}', [FocusSessionController::class, 'update']);
    });
});
