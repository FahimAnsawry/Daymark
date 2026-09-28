<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\TaskCompletion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaskCompletion>
 */
class TaskCompletionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'user_id' => fn (array $attributes) => Task::find($attributes['task_id'])->user_id,
            'completed_on' => now()->toDateString(),
        ];
    }
}
