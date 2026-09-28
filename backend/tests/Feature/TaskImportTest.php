<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskImportTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{projects: list<string>, tasks: list<array<string, mixed>>}
     */
    private function payload(): array
    {
        return [
            'projects' => ['Work', 'Empty project'],
            'tasks' => [
                ['client_id' => 'a1b2', 'title' => 'Ship it', 'done' => false, 'due' => '2026-10-01', 'time' => '', 'project' => 'Work', 'label' => 'urgent', 'repeat' => 'none'],
                ['client_id' => 'c3d4', 'title' => 'Old chore', 'done' => true, 'due' => '', 'project' => '', 'label' => ''],
            ],
        ];
    }

    public function test_import_requires_authentication(): void
    {
        $this->postJson('/api/tasks/import', $this->payload())->assertUnauthorized();
    }

    public function test_browser_tasks_and_projects_are_imported(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/tasks/import', $this->payload())
            ->assertOk()
            ->assertJsonPath('imported', 2);

        $this->assertEqualsCanonicalizing(['Work', 'Empty project'], $user->projects()->pluck('name')->all());
        $this->assertDatabaseHas('tasks', ['user_id' => $user->id, 'client_id' => 'a1b2', 'label' => 'urgent', 'done' => false]);
        $this->assertDatabaseHas('tasks', ['user_id' => $user->id, 'client_id' => 'c3d4', 'done' => true]);

        $this->getJson('/api/tasks')->assertJsonPath('data.0.project', 'Work');
    }

    public function test_importing_the_same_data_twice_does_not_duplicate_it(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/tasks/import', $this->payload());
        $this->postJson('/api/tasks/import', $this->payload())->assertJsonPath('imported', 0);

        $this->assertSame(2, $user->tasks()->count());
        $this->assertSame(2, $user->projects()->count());
    }

    public function test_import_accepts_empty_lists(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/tasks/import', ['projects' => [], 'tasks' => []])
            ->assertOk()
            ->assertJsonPath('imported', 0);
    }

    public function test_invalid_import_is_rejected_without_saving_anything(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $payload = $this->payload();
        $payload['tasks'][1]['title'] = '';

        $this->postJson('/api/tasks/import', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['tasks.1.title']);

        $this->assertSame(0, $user->tasks()->count());
    }
}
