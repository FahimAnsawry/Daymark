<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * Return backend health and configuration status.
     */
    public function __invoke(): JsonResponse
    {
        $dbConnected = false;
        $dbError = null;

        try {
            DB::connection()->getPdo();
            $dbConnected = true;
        } catch (\Throwable $e) {
            $dbError = $e->getMessage();
        }

        return response()->json([
            'status' => 'healthy',
            'framework' => 'Laravel ' . app()->version(),
            'php_version' => PHP_VERSION,
            'database' => [
                'connection' => config('database.default'),
                'host' => config('database.connections.pgsql.host'),
                'port' => config('database.connections.pgsql.port'),
                'database' => config('database.connections.pgsql.database'),
                'connected' => $dbConnected,
                'error' => $dbConnected ? null : 'PostgreSQL connection failed. Please check DB_PASSWORD in backend/.env',
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
