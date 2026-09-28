<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StartCheckoutRequest;
use App\Models\User;
use App\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Simulated billing: checkout records a subscription locally and nothing is ever charged.
 */
class BillingController extends Controller
{
    /**
     * The user's plan and subscription state.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json($this->status($request->user()));
    }

    /**
     * Start a plan. First-time subscribers get the free trial.
     */
    public function checkout(StartCheckoutRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->currentPlan()->isPaid()) {
            return response()->json([
                'message' => 'You already have a plan. You can cancel it from billing settings first.',
            ], Response::HTTP_CONFLICT);
        }

        $isFirstSubscription = ! $user->subscriptions()->exists();

        $user->subscriptions()->create([
            ...$request->validated(),
            'trial_ends_at' => $isFirstSubscription ? now()->addDays(Plan::TRIAL_DAYS) : null,
        ]);

        return response()->json($this->status($user->refresh()), Response::HTTP_CREATED);
    }

    /**
     * Switch between paid plans, keeping the billing period, card and any remaining trial.
     */
    public function change(Request $request): JsonResponse
    {
        $validated = $request->validate(['plan' => ['required', 'in:plus,pro']]);
        $user = $request->user();
        $current = $user->subscription;

        if ($current === null || $current->canceled_at !== null || ! $current->isValid()) {
            return response()->json([
                'message' => 'Choose a plan to start with first.',
            ], Response::HTTP_CONFLICT);
        }

        if ($current->plan === Plan::from($validated['plan'])) {
            return response()->json([
                'message' => 'You’re already on this plan.',
            ], Response::HTTP_CONFLICT);
        }

        $trialEndsAt = $current->onTrial() ? $current->trial_ends_at : null;

        DB::transaction(function () use ($user, $current, $validated, $trialEndsAt): void {
            $current->update(['canceled_at' => now(), 'ends_at' => now()]);

            $user->subscriptions()->create([
                'plan' => $validated['plan'],
                'period' => $current->period,
                'card_brand' => $current->card_brand,
                'card_last4' => $current->card_last4,
                'trial_ends_at' => $trialEndsAt,
            ]);
        });

        return response()->json($this->status($user->refresh()));
    }

    /**
     * Cancel the current plan.
     */
    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->subscription;

        if ($subscription === null || $subscription->canceled_at !== null || ! $subscription->isValid()) {
            return response()->json([
                'message' => 'There’s no active plan to cancel.',
            ], Response::HTTP_CONFLICT);
        }

        $subscription->cancel();

        return response()->json($this->status($user->refresh()));
    }

    /**
     * Immediately cancel / end the free trial (temporary development helper).
     */
    public function cancelTrial(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->subscription;

        if ($subscription === null && ! $user->subscriptions()->exists()) {
            return response()->json([
                'message' => 'There’s no active plan or trial to cancel.',
            ], Response::HTTP_CONFLICT);
        }

        $user->subscriptions()->delete();

        return response()->json($this->status($user->refresh()));
    }

    /**
     * @return array{plan: string, status: string|null, period: string|null, on_trial: bool, trial_ends_at: string|null, ends_at: string|null, card_brand: string|null, card_last4: string|null}
     */
    private function status(User $user): array
    {
        $subscription = $user->subscription;

        return [
            'plan' => $user->currentPlan()->value,
            'status' => $subscription?->status(),
            'period' => $subscription?->period,
            'on_trial' => (bool) $subscription?->onTrial(),
            'trial_ends_at' => $subscription?->trial_ends_at?->toIso8601String(),
            'ends_at' => $subscription?->ends_at?->toIso8601String(),
            'card_brand' => $subscription?->card_brand,
            'card_last4' => $subscription?->card_last4,
        ];
    }
}
