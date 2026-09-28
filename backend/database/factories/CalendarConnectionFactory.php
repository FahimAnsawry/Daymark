<?php

namespace Database\Factories;

use App\Models\CalendarConnection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CalendarConnection>
 */
class CalendarConnectionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'provider' => 'google',
            'email' => fake()->safeEmail(),
            'access_token' => 'access-token',
            'refresh_token' => 'refresh-token',
            'expires_at' => now()->addHour(),
        ];
    }

    public function expired(): static
    {
        return $this->state(fn () => ['expires_at' => now()->subMinute()]);
    }
}
