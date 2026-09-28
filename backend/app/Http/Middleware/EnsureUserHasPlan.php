<?php

namespace App\Http\Middleware;

use App\Plan;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPlan
{
    /**
     * Reject the request with 402 unless the user's plan includes the required one
     * (used as `plan:plus` or `plan:pro`).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $required): Response
    {
        $requiredPlan = Plan::from($required);

        if (! $request->user()?->hasPlan($requiredPlan)) {
            return self::upgradeRequired($requiredPlan);
        }

        return $next($request);
    }

    /**
     * The 402 response the SPA turns into a calm upgrade prompt.
     */
    public static function upgradeRequired(Plan $required): JsonResponse
    {
        return response()->json([
            'message' => 'This is part of Daymark '.ucfirst($required->value).'.',
            'required_plan' => $required->value,
            'upgrade' => true,
        ], Response::HTTP_PAYMENT_REQUIRED);
    }
}
