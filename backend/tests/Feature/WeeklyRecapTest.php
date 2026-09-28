<?php

namespace Tests\Feature;

use App\Mail\WeeklyRecapMail;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Plan;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class WeeklyRecapTest extends TestCase
{
    use RefreshDatabase;

    public function test_pro_users_get_a_recap_on_sunday_evening_in_their_timezone(): void
    {
        Mail::fake();
        $user = User::factory()->subscribed(Plan::Pro)->create(['timezone' => 'Asia/Dhaka']);
        $task = Task::factory()->for($user)->for(Project::factory()->for($user)->create(['name' => 'Home']))->create();
        TaskCompletion::factory()->count(2)->for($task)->create(['user_id' => $user->id, 'completed_on' => '2026-09-23']);
        TaskCompletion::factory()->for($task)->create(['user_id' => $user->id, 'completed_on' => '2026-09-10']);

        // Sunday 27 Sep, 18:00 in Dhaka (UTC+6).
        $this->travelTo(CarbonImmutable::parse('2026-09-27 12:00:00', 'UTC'));
        $this->artisan('daymark:send-weekly-recaps')->assertSuccessful();

        Mail::assertQueued(WeeklyRecapMail::class, function (WeeklyRecapMail $mail) use ($user): bool {
            return $mail->hasTo($user->email)
                && $mail->recap['from'] === '2026-09-21'
                && $mail->recap['to'] === '2026-09-27'
                && $mail->recap['completed'] === 2
                && $mail->recap['days_with_progress'] === 1
                && $mail->recap['by_project'] === [['project' => 'Home', 'completed' => 2]];
        });
    }

    public function test_recap_skips_other_hours_non_pro_users_and_opt_outs(): void
    {
        Mail::fake();
        User::factory()->subscribed(Plan::Plus)->create();
        User::factory()->create();
        User::factory()->subscribed(Plan::Pro)->create(['weekly_recap' => false]);
        User::factory()->subscribed(Plan::Pro)->create(['timezone' => 'America/New_York']);

        $this->travelTo(CarbonImmutable::parse('2026-09-27 18:00:00', 'UTC'));
        $this->artisan('daymark:send-weekly-recaps')->assertSuccessful();

        Mail::assertNothingQueued();
    }

    public function test_recap_email_renders(): void
    {
        $user = User::factory()->make(['name' => 'Sam']);

        $mail = new WeeklyRecapMail($user, [
            'from' => '2026-09-21',
            'to' => '2026-09-27',
            'completed' => 3,
            'days_with_progress' => 2,
            'by_project' => [['project' => '', 'completed' => 3]],
        ]);

        $mail->assertSeeInHtml('You finished')
            ->assertSeeInHtml('No project')
            ->assertSeeInHtml('Plan the week ahead');
    }
}
