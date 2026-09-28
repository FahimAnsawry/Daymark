<?php

namespace App;

/**
 * Daymark's subscription tiers. Each paid tier includes everything in the tiers below it.
 */
enum Plan: string
{
    case Free = 'free';
    case Plus = 'plus';
    case Pro = 'pro';

    public const TRIAL_DAYS = 7;

    /**
     * Whether this plan unlocks features that need the given plan.
     */
    public function includes(Plan $required): bool
    {
        return $this->rank() >= $required->rank();
    }

    public function isPaid(): bool
    {
        return $this !== self::Free;
    }

    private function rank(): int
    {
        return match ($this) {
            self::Free => 0,
            self::Plus => 1,
            self::Pro => 2,
        };
    }
}
