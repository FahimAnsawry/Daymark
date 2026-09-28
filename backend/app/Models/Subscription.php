<?php

namespace App\Models;

use App\Plan;
use Database\Factories\SubscriptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A simulated subscription. Nothing is charged; a trial simply turns "active" once it ends.
 */
#[Fillable(['user_id', 'plan', 'period', 'card_brand', 'card_last4', 'trial_ends_at', 'canceled_at', 'ends_at'])]
class Subscription extends Model
{
    /** @use HasFactory<SubscriptionFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Whether the subscription still gives access (cancelled ones keep it until `ends_at`).
     */
    public function isValid(): bool
    {
        return $this->ends_at === null || $this->ends_at->isFuture();
    }

    public function onTrial(): bool
    {
        return $this->canceled_at === null && $this->trial_ends_at?->isFuture() === true;
    }

    /**
     * @return 'trialing'|'active'|'canceled'|'ended'
     */
    public function status(): string
    {
        return match (true) {
            ! $this->isValid() => 'ended',
            $this->canceled_at !== null => 'canceled',
            $this->onTrial() => 'trialing',
            default => 'active',
        };
    }

    /**
     * Cancel. A trial keeps access until it ends; a paid plan ends now, since the
     * simulation doesn't track billing periods.
     */
    public function cancel(): void
    {
        $this->update([
            'canceled_at' => now(),
            'ends_at' => $this->onTrial() ? $this->trial_ends_at : now(),
        ]);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'plan' => Plan::class,
            'trial_ends_at' => 'datetime',
            'canceled_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }
}
