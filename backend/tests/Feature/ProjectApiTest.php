<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_endpoints_require_authentication(): void
    {
        $this->getJson('/api/projects')->assertUnauthorized();
    }

    public function test_user_can_create_and_list_projects(): void
    {
        $user = User::factory()->create();
        Project::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/projects', ['name' => '  Garden  '])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Garden');

        $this->getJson('/api/projects')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Garden')
            ->assertJsonPath('data.0.tasks_count', 0);
    }

    public function test_creating_an_existing_project_returns_it(): void
    {
        $user = User::factory()->create();
        Project::factory()->for($user)->create(['name' => 'Garden']);
        Sanctum::actingAs($user);

        $this->postJson('/api/projects', ['name' => 'Garden'])->assertOk();

        $this->assertSame(1, $user->projects()->count());
    }

    public function test_empty_project_can_be_deleted(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->deleteJson("/api/projects/{$project->id}")->assertOk();

        $this->assertModelMissing($project);
    }

    public function test_deleting_a_project_also_deletes_its_tasks(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create();
        $projectTask = Task::factory()->for($user)->for($project)->create();
        $unassignedTask = Task::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->deleteJson("/api/projects/{$project->id}")->assertOk();

        $this->assertModelMissing($project);
        $this->assertModelMissing($projectTask);
        $this->assertModelExists($unassignedTask);
    }

    public function test_user_cannot_delete_another_users_project(): void
    {
        $project = Project::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/projects/{$project->id}")->assertForbidden();
    }
}
