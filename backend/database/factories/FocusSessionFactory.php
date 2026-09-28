<?php

namespace Database\Factories;

use App\Models\FocusSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FocusSession>
 */
class FocusSessionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'planned_minutes' => 25,
            'started_at' => now()->subMinutes(30),
            'ended_at' => now()->subMinutes(5),
            'focused_seconds' => 25 * 60,
        ];
    }

    public function running(): static
    {
        return $this->state(fn () => ['started_at' => now()->subMinutes(5), 'ended_at' => null, 'focused_seconds' => 0]);
    }
}
