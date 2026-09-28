<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_endpoints_require_authentication(): void
    {
        $this->getJson('/api/tasks')->assertUnauthorized();
        $this->postJson('/api/tasks', ['title' => 'Nope'])->assertUnauthorized();
    }

    public function test_user_can_create_a_task_in_the_dashboard_shape(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/tasks', [
            'title' => 'Write weekly review',
            'due' => '2026-10-02',
            'time' => '09:30',
            'project' => 'Work',
            'label' => 'focus',
            'repeat' => 'weekly',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Write weekly review')
            ->assertJsonPath('data.done', false)
            ->assertJsonPath('data.due', '2026-10-02')
            ->assertJsonPath('data.time', '09:30')
            ->assertJsonPath('data.project', 'Work')
            ->assertJsonPath('data.label', 'focus')
            ->assertJsonPath('data.repeat', 'weekly');

        $this->assertDatabaseHas('projects', ['user_id' => $user->id, 'name' => 'Work']);
        $this->assertDatabaseHas('tasks', ['user_id' => $user->id, 'title' => 'Write weekly review']);
    }

    public function test_empty_optional_fields_are_returned_as_empty_strings(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/tasks', ['title' => 'Inbox item', 'due' => '', 'project' => '', 'label' => '', 'time' => ''])
            ->assertCreated()
            ->assertJsonPath('data.due', '')
            ->assertJsonPath('data.project', '')
            ->assertJsonPath('data.label', '')
            ->assertJsonPath('data.time', '')
            ->assertJsonPath('data.repeat', 'none');
    }

    public function test_task_creation_is_validated(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/tasks', ['title' => '', 'due' => '02/10/2026', 'repeat' => 'hourly'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'due', 'repeat']);
    }

    public function test_index_only_lists_the_users_own_tasks(): void
    {
        $user = User::factory()->create();
        Task::factory()->count(2)->for($user)->create();
        Task::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/tasks')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_user_can_update_a_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['title' => 'Old']);
        Sanctum::actingAs($user);

        $this->patchJson("/api/tasks/{$task->id}", ['title' => 'New', 'project' => 'Home'])
            ->assertOk()
            ->assertJsonPath('data.title', 'New')
            ->assertJsonPath('data.project', 'Home');
    }

    public function test_user_can_delete_a_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->deleteJson("/api/tasks/{$task->id}")->assertOk();

        $this->assertModelMissing($task);
    }

    public function test_user_cannot_change_another_users_task(): void
    {
        $task = Task::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/tasks/{$task->id}", ['title' => 'Hijacked'])->assertForbidden();
        $this->postJson("/api/tasks/{$task->id}/complete", ['completed_on' => '2026-09-28'])->assertForbidden();
        $this->deleteJson("/api/tasks/{$task->id}")->assertForbidden();

        $this->assertModelExists($task);
    }

    public function test_project_names_are_reused_per_user(): void
    {
        $user = User::factory()->create();
        Project::factory()->for($user)->create(['name' => 'Work']);
        Sanctum::actingAs($user);

        $this->postJson('/api/tasks', ['title' => 'A', 'project' => 'Work'])->assertCreated();

        $this->assertSame(1, $user->projects()->count());
    }
}
