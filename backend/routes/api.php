<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\FocusSessionController;
use App\Http\Controllers\Api\HealthController;
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

    // Socialite OAuth Routes
    Route::post('/google/demo', [AuthController::class, 'loginWithDemoGoogle']);
    Route::get('/{provider}/redirect', [AuthController::class, 'redirectToProvider']);
    Route::match(['get', 'post'], '/{provider}/callback', [AuthController::class, 'handleProviderCallback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'updatePassword']);
        Route::put('/preferences', [AuthController::class, 'updatePreferences']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Authenticated User Route
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Google redirects the browser here after calendar consent; the user comes from `state`.
Route::get('/calendar/google/callback', [CalendarController::class, 'callback']);

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

    // Calendar status and disconnecting work on any plan, so a lapsed plan can still unlink.
    Route::get('/calendar', [CalendarController::class, 'show']);
    Route::delete('/calendar', [CalendarController::class, 'disconnect']);

    // Daymark Pro
    Route::middleware('plan:pro')->group(function () {
        Route::post('/projects/{project}/invitations', [ProjectInvitationController::class, 'store']);
        Route::post('/calendar/google/connect', [CalendarController::class, 'connect']);
        Route::get('/calendar/events', [CalendarController::class, 'events']);
    });

    // Daymark Plus
    Route::middleware('plan:plus')->group(function () {
        Route::post('/push/subscriptions', [PushSubscriptionController::class, 'store']);
        Route::get('/focus-sessions/current', [FocusSessionController::class, 'current']);
        Route::post('/focus-sessions', [FocusSessionController::class, 'store']);
        Route::patch('/focus-sessions/{focusSession}', [FocusSessionController::class, 'update']);
    });
});
