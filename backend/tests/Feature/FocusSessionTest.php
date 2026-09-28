<?php

namespace Tests\Feature;

use App\Models\FocusSession;
use App\Models\Task;
use App\Models\User;
use App\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FocusSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_focus_sessions_need_plus(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/focus-sessions', ['planned_minutes' => 25])
            ->assertPaymentRequired()
            ->assertJsonPath('required_plan', 'plus');
        $this->getJson('/api/focus-sessions/current')->assertPaymentRequired();
    }

    public function test_starting_a_session_on_a_task(): void
    {
        $this->freezeTime();
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create(['title' => 'Finish the draft']);
        Sanctum::actingAs($user);

        $this->postJson('/api/focus-sessions', ['task_id' => $task->id, 'planned_minutes' => 25])
            ->assertCreated()
            ->assertJsonPath('data.task_title', 'Finish the draft')
            ->assertJsonPath('data.planned_minutes', 25)
            ->assertJsonPath('data.ended_at', null);

        $this->getJson('/api/focus-sessions/current')
            ->assertOk()
            ->assertJsonPath('data.task_id', $task->id);
    }

    public function test_cannot_focus_on_someone_elses_task(): void
    {
        Sanctum::actingAs(User::factory()->subscribed(Plan::Plus)->create());

        $this->postJson('/api/focus-sessions', ['task_id' => Task::factory()->create()->id, 'planned_minutes' => 25])
            ->assertForbidden();
    }

    public function test_cannot_focus_on_a_reminder_task(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create([
            'due_date' => '2026-10-01',
            'reminder' => '10:00',
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/focus-sessions', ['task_id' => $task->id, 'planned_minutes' => 25])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['task_id'])
            ->assertJsonPath('errors.task_id.0', 'Reminder tasks cannot be used for focus sessions.');
    }

    public function test_starting_again_finishes_the_running_session(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $running = FocusSession::factory()->for($user)->running()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/focus-sessions', ['planned_minutes' => 50])->assertCreated();

        $this->assertNotNull($running->fresh()->ended_at);
        $this->assertSame(1, $user->focusSessions()->whereNull('ended_at')->count());
    }

    public function test_finishing_counts_at_most_the_time_that_passed(): void
    {
        $this->freezeTime();
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $session = FocusSession::factory()->for($user)->create(['started_at' => now()->subMinutes(10), 'ended_at' => null]);
        Sanctum::actingAs($user);

        $this->patchJson("/api/focus-sessions/{$session->id}", ['focused_seconds' => 9999])
            ->assertOk()
            ->assertJsonPath('data.focused_seconds', 600);

        $this->assertNull($this->getJson('/api/focus-sessions/current')->json('data'));
    }

    public function test_cannot_finish_someone_elses_session(): void
    {
        Sanctum::actingAs(User::factory()->subscribed(Plan::Plus)->create());

        $this->patchJson('/api/focus-sessions/'.FocusSession::factory()->running()->create()->id, ['focused_seconds' => 60])
            ->assertForbidden();
    }

    public function test_report_includes_focused_minutes_for_plus(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        FocusSession::factory()->for($user)->create(['started_at' => '2026-09-24 10:00:00', 'focused_seconds' => 1500]);
        FocusSession::factory()->for($user)->create(['started_at' => '2026-09-01 10:00:00', 'focused_seconds' => 1500]);
        Sanctum::actingAs($user);

        $this->getJson('/api/reports/tasks?group=day&from=2026-09-19&to=2026-09-25&today=2026-09-25')
            ->assertOk()
            ->assertJsonPath('focus_minutes', 25);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/reports/tasks?group=day&from=2026-09-19&to=2026-09-25&today=2026-09-25')
            ->assertJsonPath('focus_minutes', null);
    }
}
