<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectInvitation;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ProjectInvitation>
 */
class ProjectInvitationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'invited_by' => fn (array $attributes) => Project::find($attributes['project_id'])->user_id,
            'email' => fake()->unique()->safeEmail(),
            'token' => Str::random(64),
        ];
    }
}
