<?php

namespace App\Console\Commands;

use App\Mail\WeeklyRecapMail;
use App\Models\User;
use App\Plan;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

#[Signature('daymark:send-weekly-recaps')]
#[Description('Email Pro users a recap of their week on Sunday evening, in their own timezone')]
class SendWeeklyRecaps extends Command
{
    /** The local hour on Sunday when recaps go out. Runs hourly, so each user matches once a week. */
    public const SEND_HOUR = 18;

    public function handle(): int
    {
        $sent = 0;

        User::query()
            ->where('weekly_recap', true)
            ->whereHas('subscriptions')
            ->with('subscription')
            ->chunkById(200, function ($users) use (&$sent): void {
                foreach ($users as $user) {
                    $localNow = CarbonImmutable::now($user->timezone);

                    if (! $localNow->isSunday() || $localNow->hour !== self::SEND_HOUR || ! $user->hasPlan(Plan::Pro)) {
                        continue;
                    }

                    Mail::to($user)->queue(new WeeklyRecapMail($user, $this->recapFor($user, $localNow)));
                    $sent++;
                }
            });

        $this->info("Queued {$sent} weekly recap(s).");

        return self::SUCCESS;
    }

    /**
     * @return array{from: string, to: string, completed: int, days_with_progress: int, by_project: array<int, array{project: string, completed: int}>}
     */
    private function recapFor(User $user, CarbonImmutable $localNow): array
    {
        $to = $localNow->toDateString();
        $from = $localNow->subDays(6)->toDateString();

        $completions = $user->taskCompletions()
            ->whereBetween('completed_on', [$from, $to])
            ->with('task.project')
            ->get();

        return [
            'from' => $from,
            'to' => $to,
            'completed' => $completions->count(),
            'days_with_progress' => $completions->unique(fn ($completion) => $completion->completed_on->toDateString())->count(),
            'by_project' => $completions
                ->countBy(fn ($completion) => $completion->task->project?->name ?? '')
                ->sortDesc()
                ->take(3)
                ->map(fn (int $count, string $name) => ['project' => $name, 'completed' => $count])
                ->values()
                ->all(),
        ];
    }
}
