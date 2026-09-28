<?php

namespace App\Console\Commands;

use App\Jobs\SendReminderPush;
use App\Mail\TaskReminderMail;
use App\Models\Task;
use App\Plan;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

#[Signature('daymark:send-reminders')]
#[Description('Email reminders that are due, holding any that fall in quiet hours until they end')]
class SendTaskReminders extends Command
{
    public function handle(): int
    {
        $sent = 0;

        Task::query()
            ->whereNotNull('remind_at')
            ->whereNull('reminded_at')
            ->where('remind_at', '<=', now())
            ->where('done', false)
            ->with(['user.subscription', 'user.pushSubscriptions', 'project'])
            ->chunkById(200, function ($tasks) use (&$sent): void {
                foreach ($tasks as $task) {
                    $user = $task->user;

                    if (! $user->hasPlan(Plan::Plus)) {
                        // The plan ended; drop the reminder rather than let it pile up.
                        $task->updateQuietly(['reminded_at' => now()]);

                        continue;
                    }

                    if ($user->isQuietAt(now())) {
                        $task->updateQuietly(['remind_at' => $user->quietHoursEndAfter(now())]);

                        continue;
                    }

                    Mail::to($user)->queue(new TaskReminderMail($task));

                    if ($user->pushSubscriptions->isNotEmpty() && SendReminderPush::isConfigured()) {
                        SendReminderPush::dispatch($task);
                    }

                    $completedOn = $user->timezone ? now($user->timezone)->toDateString() : now()->toDateString();
                    $task->autoComplete($completedOn);

                    $sent++;
                }
            });

        $this->info("Queued {$sent} reminder(s).");

        return self::SUCCESS;
    }
}
