<?php

namespace Tests\Feature;

use App\Mail\DailyDigestMail;
use App\Mail\TaskReminderMail;
use App\Models\Task;
use App\Models\User;
use App\Plan;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskReminderTest extends TestCase
{
    use RefreshDatabase;

    public function test_setting_a_reminder_needs_plus(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/tasks', ['title' => 'Call the dentist', 'due' => '2026-10-01', 'reminder' => '17:00'])
            ->assertPaymentRequired()
            ->assertJsonPath('required_plan', 'plus');

        $this->postJson('/api/tasks', ['title' => 'Call the dentist', 'reminder' => null])->assertCreated();
    }

    public function test_an_early_reminder_goes_out_ten_minutes_before_the_picked_time(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create(['timezone' => 'Asia/Dhaka']);
        Sanctum::actingAs($user);

        $this->postJson('/api/tasks', ['title' => 'Call the dentist', 'due' => '2026-10-01', 'reminder' => '05:00', 'reminder_early' => true])
            ->assertCreated()
            ->assertJsonPath('data.reminder', '05:00')
            ->assertJsonPath('data.reminder_early', true)
            ->assertJsonPath('data.remind_at', '2026-09-30T22:50:00+00:00');
    }

    public function test_a_reminder_goes_out_at_the_picked_time_unless_it_is_early(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create(['due_date' => '2026-10-01', 'due_time' => '09:00', 'reminder' => '05:00']);

        $this->assertSame('2026-10-01 05:00:00', $task->remind_at->toDateTimeString());
        $this->assertFalse($task->reminder_early);
    }

    public function test_a_reminder_can_be_a_clock_time_on_the_due_date(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create(['timezone' => 'Asia/Dhaka']);
        Sanctum::actingAs($user);

        $this->postJson('/api/tasks', ['title' => 'Call mom', 'due' => '2026-10-01', 'reminder' => '17:00'])
            ->assertCreated()
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.reminder', '17:00')
            ->assertJsonPath('data.remind_at', '2026-10-01T11:00:00+00:00');
    }

    public function test_reminder_values_are_validated(): void
    {
        Sanctum::actingAs(User::factory()->subscribed(Plan::Plus)->create());

        foreach (['24:00', '5pm', '17:00:00', 'later', 'at', '10m', '1h', 'morning', 'daily'] as $reminder) {
            $this->postJson('/api/tasks', ['title' => 'Call mom', 'due' => '2026-10-01', 'reminder' => $reminder])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['reminder']);
        }

        foreach (['05:00', '17:00'] as $reminder) {
            $this->postJson('/api/tasks', ['title' => 'Call mom', 'due' => '2026-10-01', 'reminder' => $reminder])
                ->assertCreated();
        }
    }

    public function test_reminder_moves_when_a_repeating_task_rolls_forward(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->repeating('daily', '2026-10-01')->create(['due_time' => '09:00', 'reminder' => '09:00']);
        $task->update(['reminded_at' => now()]);
        Sanctum::actingAs($user);

        $this->postJson("/api/tasks/{$task->id}/auto-complete", ['completed_on' => '2026-10-01'])->assertOk();

        $task->refresh();
        $this->assertSame('2026-10-02 09:00:00', $task->remind_at->toDateTimeString());
        $this->assertNull($task->reminded_at);
    }

    public function test_changing_timezone_moves_pending_reminders(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create(['due_date' => '2026-10-01', 'due_time' => '09:00', 'reminder' => '09:00']);
        Sanctum::actingAs($user);

        $this->putJson('/api/auth/preferences', ['timezone' => 'Asia/Dhaka'])->assertOk();

        $this->assertSame('2026-10-01 03:00:00', $task->fresh()->remind_at->toDateTimeString());
    }

    public function test_due_reminders_are_emailed_once(): void
    {
        Mail::fake();
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create(['due_date' => '2026-10-01', 'due_time' => '09:00', 'reminder' => '09:00']);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 09:00:30'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        Mail::assertQueuedCount(1);
        Mail::assertQueued(TaskReminderMail::class, fn (TaskReminderMail $mail) => $mail->task->is($task));
        $this->assertNotNull($task->fresh()->reminded_at);
    }

    public function test_reminders_wait_for_quiet_hours_to_end(): void
    {
        Mail::fake();
        $user = User::factory()->subscribed(Plan::Plus)->create(['quiet_hours_start' => '21:00', 'quiet_hours_end' => '07:00']);
        $task = Task::factory()->for($user)->create(['due_date' => '2026-10-01', 'due_time' => '22:30', 'reminder' => '22:30']);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 22:30:00'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        Mail::assertNothingQueued();
        $this->assertSame('2026-10-02 07:00:00', $task->fresh()->remind_at->toDateTimeString());
    }

    public function test_reminders_are_dropped_after_the_plan_ends(): void
    {
        Mail::fake();
        $task = Task::factory()->for(User::factory())->create(['due_date' => '2026-10-01', 'reminder' => '08:00']);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 09:00:00'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        Mail::assertNothingQueued();
        $this->assertNotNull($task->fresh()->reminded_at);
    }

    public function test_morning_digest_lists_todays_tasks(): void
    {
        Mail::fake();
        $user = User::factory()->subscribed(Plan::Plus)->create(['morning_digest' => true]);
        Task::factory()->for($user)->create(['title' => 'Finish the draft', 'due_date' => '2026-10-01']);
        Task::factory()->for($user)->create(['title' => 'Later', 'due_date' => '2026-10-05']);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 08:10:00'));
        $this->artisan('daymark:send-digests')->assertSuccessful();

        Mail::assertQueued(DailyDigestMail::class, fn (DailyDigestMail $mail) => $mail->kind === 'morning'
            && $mail->digest['tasks'] === ['Finish the draft']);
    }

    public function test_digests_respect_opt_in_and_plan(): void
    {
        Mail::fake();
        User::factory()->subscribed(Plan::Plus)->create();
        User::factory()->create(['morning_digest' => true]);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 08:10:00'));
        $this->artisan('daymark:send-digests')->assertSuccessful();

        Mail::assertNothingQueued();
    }

    public function test_reminder_preferences_are_validated(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/auth/preferences', ['quiet_hours_start' => '21:00'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['quiet_hours_end']);

        $this->putJson('/api/auth/preferences', ['quiet_hours_start' => '21:00', 'quiet_hours_end' => '07:00', 'morning_digest' => true])
            ->assertOk()
            ->assertJsonPath('user.quiet_hours_start', '21:00')
            ->assertJsonPath('user.morning_digest', true);
    }

    public function test_daily_reminders_reschedule_for_next_day_after_sending(): void
    {
        Mail::fake();
        $user = User::factory()->subscribed(Plan::Plus)->create(['timezone' => 'UTC']);
        $task = Task::factory()->for($user)->create([
            'due_date' => '2026-10-01',
            'due_time' => '09:00',
            'reminder' => '09:00',
            'reminder_frequency' => 'daily',
        ]);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 09:00:30'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        Mail::assertQueuedCount(1);
        $task->refresh();
        $this->assertSame('2026-10-02 09:00:00', $task->remind_at->toDateTimeString());
        $this->assertNull($task->reminded_at);

        // Next day arrives
        $this->travelTo(CarbonImmutable::parse('2026-10-02 09:00:30'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        Mail::assertQueuedCount(2);
        $task->refresh();
        $this->assertSame('2026-10-03 09:00:00', $task->remind_at->toDateTimeString());
    }

    public function test_weekly_and_monthly_reminders_reschedule(): void
    {
        Mail::fake();
        $user = User::factory()->subscribed(Plan::Plus)->create(['timezone' => 'UTC']);
        $weeklyTask = Task::factory()->for($user)->create([
            'due_date' => '2026-10-01',
            'due_time' => '10:00',
            'reminder' => '10:00',
            'reminder_frequency' => 'weekly',
        ]);
        $monthlyTask = Task::factory()->for($user)->create([
            'due_date' => '2026-10-01',
            'due_time' => '11:00',
            'reminder' => '11:00',
            'reminder_frequency' => 'monthly',
        ]);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 11:30:00'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        $this->assertSame('2026-10-08 10:00:00', $weeklyTask->fresh()->remind_at->toDateTimeString());
        $this->assertSame('2026-11-01 11:00:00', $monthlyTask->fresh()->remind_at->toDateTimeString());
    }

    public function test_completed_tasks_stop_receiving_recurring_reminders(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create([
            'due_date' => '2026-10-01',
            'due_time' => '10:00',
            'reminder' => '10:00',
            'reminder_frequency' => 'daily',
        ]);

        $this->assertNotNull($task->remind_at);

        $task->update(['done' => true]);

        $this->assertNull($task->fresh()->remind_at);
    }

    public function test_a_reminder_without_a_frequency_is_sent_once(): void
    {
        Mail::fake();
        $user = User::factory()->subscribed(Plan::Plus)->create(['timezone' => 'UTC']);
        $task = Task::factory()->for($user)->create(['due_date' => '2026-10-01', 'reminder' => '17:00']);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 17:00:30'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();
        $this->travelTo(CarbonImmutable::parse('2026-10-02 17:00:30'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        Mail::assertQueuedCount(1);
        $this->assertNotNull($task->fresh()->reminded_at);
    }

    public function test_a_clock_time_reminder_can_repeat(): void
    {
        Mail::fake();
        $user = User::factory()->subscribed(Plan::Plus)->create(['timezone' => 'Asia/Dhaka']);
        Sanctum::actingAs($user);

        $id = $this->postJson('/api/tasks', ['title' => 'Call mom', 'due' => '2026-10-01', 'reminder' => '17:00', 'reminder_frequency' => 'daily'])
            ->assertCreated()
            ->assertJsonPath('data.reminder_frequency', 'daily')
            ->json('data.id');

        $this->travelTo(CarbonImmutable::parse('2026-10-01 11:00:30'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        Mail::assertQueuedCount(1);
        $this->assertSame('2026-10-02 11:00:00', Task::find($id)->remind_at->toDateTimeString());
    }

    public function test_repeating_reminders_catch_up_to_the_next_time_and_keep_the_day_of_month(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create(['timezone' => 'UTC']);
        $task = Task::factory()->for($user)->create(['due_date' => '2026-01-31', 'reminder' => '09:00', 'reminder_frequency' => 'monthly']);

        $this->assertSame('2026-02-28 09:00:00', $task->nextReminderAfter(CarbonImmutable::parse('2026-01-31 09:00:00'))->toDateTimeString());
        $this->assertSame('2026-03-31 09:00:00', $task->nextReminderAfter(CarbonImmutable::parse('2026-03-02 12:00:00'))->toDateTimeString());
    }

    public function test_reminder_cannot_be_removed_from_a_reminder_task(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create(['due_date' => '2026-10-01', 'reminder' => '17:00', 'reminder_frequency' => 'weekly']);
        Sanctum::actingAs($user);

        $this->patchJson("/api/tasks/{$task->id}", ['reminder' => null])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Reminders cannot be removed from a reminder task.');

        $this->assertSame('17:00', $task->fresh()->reminder);
    }

    public function test_once_reminder_is_completed_after_sending(): void
    {
        Mail::fake();
        $user = User::factory()->subscribed(Plan::Plus)->create(['timezone' => 'UTC']);
        $task = Task::factory()->for($user)->create(['due_date' => '2026-10-01', 'reminder' => '17:00']);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 17:00:30'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        $fresh = $task->fresh();
        $this->assertTrue($fresh->done);
        $this->assertNotNull($fresh->completed_at);
        $this->assertNotNull($fresh->reminded_at);
        $this->assertNull($fresh->remind_at);
        $this->assertDatabaseHas('task_completions', [
            'task_id' => $task->id,
            'completed_on' => '2026-10-01',
        ]);
    }

    public function test_recurring_reminder_is_completed_for_today_after_sending(): void
    {
        Mail::fake();
        $user = User::factory()->subscribed(Plan::Plus)->create(['timezone' => 'UTC']);
        $task = Task::factory()->for($user)->create([
            'due_date' => '2026-10-01',
            'due_time' => '09:00',
            'reminder' => '09:00',
            'reminder_frequency' => 'daily',
        ]);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 09:00:30'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        $fresh = $task->fresh();
        $this->assertFalse($fresh->done);
        $this->assertSame('2026-10-02', $fresh->due_date->toDateString());
        $this->assertSame('2026-10-02 09:00:00', $fresh->remind_at->toDateTimeString());
        $this->assertNotNull($fresh->completed_at);
        $this->assertDatabaseHas('task_completions', [
            'task_id' => $task->id,
            'completed_on' => '2026-10-01',
        ]);
    }

    public function test_reminder_task_cannot_be_manually_completed(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create([
            'due_date' => '2026-10-01',
            'reminder' => '09:00',
        ]);
        Sanctum::actingAs($user);

        $this->postJson("/api/tasks/{$task->id}/complete", ['completed_on' => '2026-10-01'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Reminder tasks cannot be manually completed. They are automatically completed at their scheduled time.');

        $this->assertFalse($task->fresh()->done);
    }

    public function test_reminder_task_can_be_auto_completed_via_endpoint(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create([
            'due_date' => '2026-10-01',
            'reminder' => '09:00',
            'reminder_frequency' => 'daily',
        ]);
        Sanctum::actingAs($user);

        $this->postJson("/api/tasks/{$task->id}/auto-complete", ['completed_on' => '2026-10-01'])
            ->assertOk()
            ->assertJsonPath('data.done', false)
            ->assertJsonPath('data.due', '2026-10-02');

        $this->assertDatabaseHas('task_completions', [
            'task_id' => $task->id,
            'completed_on' => '2026-10-01',
        ]);
    }

    public function test_querying_tasks_auto_completes_due_reminders(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create(['timezone' => 'UTC']);
        $task = Task::factory()->for($user)->create([
            'due_date' => '2026-10-01',
            'reminder' => '09:00',
        ]);
        Sanctum::actingAs($user);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 09:05:00'));

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonPath('data.0.done', true);

        $this->assertTrue($task->fresh()->done);
    }

    public function test_reminder_task_can_be_edited(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create([
            'title' => 'Initial Title',
            'due_date' => '2026-10-01',
            'reminder' => '09:00',
        ]);
        Sanctum::actingAs($user);

        $this->patchJson("/api/tasks/{$task->id}", [
            'title' => 'Updated Title',
            'due' => '2026-10-05',
            'reminder' => '11:00',
        ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated Title')
            ->assertJsonPath('data.due', '2026-10-05')
            ->assertJsonPath('data.reminder', '11:00');

        $fresh = $task->fresh();
        $this->assertSame('Updated Title', $fresh->title);
        $this->assertSame('2026-10-05', $fresh->due_date->toDateString());
        $this->assertSame('11:00', $fresh->reminder);
    }

    public function test_reminder_task_can_be_deleted(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $task = Task::factory()->for($user)->create([
            'due_date' => '2026-10-01',
            'reminder' => '09:00',
        ]);
        Sanctum::actingAs($user);

        $this->deleteJson("/api/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Task deleted');

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }
}
