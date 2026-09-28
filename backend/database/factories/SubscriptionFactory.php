<?php

namespace Database\Factories;

use App\Models\Subscription;
use App\Models\User;
use App\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'plan' => Plan::Plus,
            'period' => 'monthly',
            'card_brand' => 'visa',
            'card_last4' => '4242',
        ];
    }

    public function trialing(): static
    {
        return $this->state(fn () => ['trial_ends_at' => now()->addDays(Plan::TRIAL_DAYS)]);
    }

    public function ended(): static
    {
        return $this->state(fn () => ['canceled_at' => now()->subWeek(), 'ends_at' => now()->subDay()]);
    }
}
