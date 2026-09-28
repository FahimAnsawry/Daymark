<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskReportTest extends TestCase
{
    use RefreshDatabase;

    private function complete(Task $task, string $date, int $times = 1): void
    {
        TaskCompletion::factory()->count($times)->for($task)->create([
            'user_id' => $task->user_id,
            'completed_on' => $date,
        ]);
    }

    public function test_report_requires_authentication(): void
    {
        $this->getJson('/api/reports/tasks?group=day&from=2026-09-01&to=2026-09-07&today=2026-09-07')
            ->assertUnauthorized();
    }

    public function test_daily_report_is_zero_filled(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $this->complete($task, '2026-09-22', 2);
        $this->complete($task, '2026-09-24');
        $this->complete($task, '2026-09-10');
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/reports/tasks?group=day&from=2026-09-22&to=2026-09-25&today=2026-09-25');

        $response->assertOk()
            ->assertJsonPath('buckets', [
                ['start' => '2026-09-22', 'completed' => 2],
                ['start' => '2026-09-23', 'completed' => 0],
                ['start' => '2026-09-24', 'completed' => 1],
                ['start' => '2026-09-25', 'completed' => 0],
            ])
            ->assertJsonPath('totals.completed', 3);
    }

    public function test_weekly_report_groups_by_monday(): void
    {
        $user = User::factory()->subscribed(Plan::Pro)->create();
        $task = Task::factory()->for($user)->create();
        $this->complete($task, '2026-09-14');
        $this->complete($task, '2026-09-20');
        $this->complete($task, '2026-09-23');
        Sanctum::actingAs($user);

        $this->getJson('/api/reports/tasks?group=week&from=2026-09-16&to=2026-09-27&today=2026-09-27')
            ->assertOk()
            ->assertJsonPath('from', '2026-09-14')
            ->assertJsonPath('buckets', [
                ['start' => '2026-09-14', 'completed' => 2],
                ['start' => '2026-09-21', 'completed' => 1],
            ]);
    }

    public function test_report_counts_open_overdue_and_per_project_completions(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create(['name' => 'Work']);
        $workTask = Task::factory()->for($user)->for($project)->create(['due_date' => '2026-09-20']);
        Task::factory()->for($user)->create(['due_date' => '2026-09-30']);
        Task::factory()->for($user)->create(['done' => true, 'due_date' => '2026-09-01']);
        $this->complete($workTask, '2026-09-25', 2);
        Sanctum::actingAs($user);

        $this->getJson('/api/reports/tasks?group=day&from=2026-09-25&to=2026-09-25&today=2026-09-25')
            ->assertOk()
            ->assertJsonPath('totals.open', 2)
            ->assertJsonPath('totals.overdue', 1)
            ->assertJsonPath('by_project', [['project' => 'Work', 'completed' => 2]]);
    }

    public function test_report_only_includes_the_users_own_completions(): void
    {
        $user = User::factory()->create();
        $this->complete(Task::factory()->create(), '2026-09-25', 3);
        Sanctum::actingAs($user);

        $this->getJson('/api/reports/tasks?group=day&from=2026-09-25&to=2026-09-25&today=2026-09-25')
            ->assertOk()
            ->assertJsonPath('totals.completed', 0);
    }

    public function test_report_parameters_are_validated(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/reports/tasks?group=month&from=2026-09-25&to=2026-09-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['group', 'to', 'today']);

        $this->getJson('/api/reports/tasks?group=day&from=2020-01-01&to=2026-09-01&today=2026-09-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to']);
    }

    public function test_reports_longer_than_a_week_need_pro(): void
    {
        Sanctum::actingAs(User::factory()->subscribed(Plan::Plus)->create());

        $this->getJson('/api/reports/tasks?group=day&from=2026-09-19&to=2026-09-25&today=2026-09-25')
            ->assertOk()
            ->assertJsonPath('streak', null);

        $this->getJson('/api/reports/tasks?group=day&from=2026-09-18&to=2026-09-25&today=2026-09-25')
            ->assertPaymentRequired()
            ->assertJsonPath('required_plan', 'pro');
    }

    public function test_pro_reports_include_the_current_streak(): void
    {
        $user = User::factory()->subscribed(Plan::Pro)->create();
        $task = Task::factory()->for($user)->create();
        $this->complete($task, '2026-09-24', 2);
        $this->complete($task, '2026-09-23');
        $this->complete($task, '2026-09-21');
        Sanctum::actingAs($user);

        // Nothing done yet today doesn't break the streak.
        $this->getJson('/api/reports/tasks?group=day&from=2026-09-01&to=2026-09-25&today=2026-09-25')
            ->assertOk()
            ->assertJsonPath('streak', 2);

        $this->complete($task, '2026-09-25');
        $this->getJson('/api/reports/tasks?group=day&from=2026-09-25&to=2026-09-25&today=2026-09-25')
            ->assertJsonPath('streak', 3);
    }
}
