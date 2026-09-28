<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class TaskCompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_completing_a_task_marks_it_done_and_logs_a_completion(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/tasks/{$task->id}/complete", ['completed_on' => '2026-09-28'])
            ->assertOk()
            ->assertJsonPath('data.done', true);

        $this->assertNotNull($task->fresh()->completed_at);
        $this->assertDatabaseHas('task_completions', [
            'task_id' => $task->id,
            'user_id' => $user->id,
            'completed_on' => '2026-09-28',
        ]);
    }

    public function test_completing_a_done_task_reopens_it_and_removes_the_completion(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/tasks/{$task->id}/complete", ['completed_on' => '2026-09-28']);
        $this->postJson("/api/tasks/{$task->id}/complete", ['completed_on' => '2026-09-28'])
            ->assertOk()
            ->assertJsonPath('data.done', false);

        $this->assertNull($task->fresh()->completed_at);
        $this->assertDatabaseCount('task_completions', 0);
    }

    #[DataProvider('repeatingDueDates')]
    public function test_repeating_task_rolls_forward_and_logs_each_completion(string $repeat, string $due, string $next): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->repeating($repeat, $due)->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/tasks/{$task->id}/complete", ['completed_on' => '2026-09-28'])
            ->assertOk()
            ->assertJsonPath('data.done', false)
            ->assertJsonPath('data.due', $next);

        $this->postJson("/api/tasks/{$task->id}/complete", ['completed_on' => '2026-09-29']);

        $this->assertSame(2, $task->completions()->count());
    }

    /**
     * @return array<string, array{string, string, string}>
     */
    public static function repeatingDueDates(): array
    {
        return [
            'daily' => ['daily', '2026-09-28', '2026-09-29'],
            'weekly' => ['weekly', '2026-09-28', '2026-10-05'],
            'monthly' => ['monthly', '2026-09-15', '2026-10-15'],
            'monthly clamps to month end' => ['monthly', '2026-01-31', '2026-02-28'],
        ];
    }

    public function test_repeating_task_without_a_due_date_is_marked_done(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['repeat' => 'daily']);
        Sanctum::actingAs($user);

        $this->postJson("/api/tasks/{$task->id}/complete", ['completed_on' => '2026-09-28'])
            ->assertOk()
            ->assertJsonPath('data.done', true);
    }

    public function test_completion_date_is_required(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/tasks/{$task->id}/complete")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['completed_on']);
    }
}
