<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(4),
            'done' => false,
            'repeat' => 'none',
        ];
    }

    public function repeating(string $repeat, string $due): static
    {
        return $this->state(['repeat' => $repeat, 'due_date' => $due]);
    }
}
