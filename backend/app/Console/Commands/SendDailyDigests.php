<?php

namespace App\Console\Commands;

use App\Mail\DailyDigestMail;
use App\Models\User;
use App\Plan;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

#[Signature('daymark:send-digests')]
#[Description('Email Plus users their morning plan and evening wind-down, in their own timezone')]
class SendDailyDigests extends Command
{
    /** Local hours the digests go out. Runs hourly, so each user matches once a day. */
    public const MORNING_HOUR = 8;

    public const EVENING_HOUR = 20;

    public function handle(): int
    {
        $sent = 0;

        User::query()
            ->where(fn ($query) => $query->where('morning_digest', true)->orWhere('evening_winddown', true))
            ->whereHas('subscriptions')
            ->with('subscription')
            ->chunkById(200, function ($users) use (&$sent): void {
                foreach ($users as $user) {
                    $kind = $this->kindFor($user, CarbonImmutable::now($user->timezone));

                    if ($kind === null || ! $user->hasPlan(Plan::Plus) || $user->isQuietAt(now())) {
                        continue;
                    }

                    Mail::to($user)->queue(new DailyDigestMail($user, $kind, $this->digestFor($user, $kind)));
                    $sent++;
                }
            });

        $this->info("Queued {$sent} digest(s).");

        return self::SUCCESS;
    }

    /**
     * @return 'morning'|'evening'|null
     */
    private function kindFor(User $user, CarbonImmutable $localNow): ?string
    {
        return match (true) {
            $user->morning_digest && $localNow->hour === self::MORNING_HOUR => 'morning',
            $user->evening_winddown && $localNow->hour === self::EVENING_HOUR => 'evening',
            default => null,
        };
    }

    /**
     * Morning: what's planned today (and anything overdue). Evening: what got done today
     * and the first few things for tomorrow.
     *
     * @return array{tasks: array<int, string>, overdue: int, done_today: int}
     */
    private function digestFor(User $user, string $kind): array
    {
        $today = CarbonImmutable::now($user->timezone);
        $day = $kind === 'morning' ? $today : $today->addDay();
        $open = $user->tasks()->where('done', false);

        return [
            'tasks' => (clone $open)->whereDate('due_date', $day->toDateString())
                ->orderByRaw('due_time is null')->orderBy('due_time')->limit(8)->pluck('title')->all(),
            'overdue' => (clone $open)->whereDate('due_date', '<', $today->toDateString())->count(),
            'done_today' => $user->taskCompletions()->whereDate('completed_on', $today->toDateString())->count(),
        ];
    }
}
