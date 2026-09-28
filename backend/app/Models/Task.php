<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

#[Fillable(['user_id', 'project_id', 'title', 'done', 'due_date', 'due_time', 'label', 'repeat', 'client_id', 'completed_at', 'reminder', 'reminder_early', 'reminder_frequency', 'remind_at', 'reminded_at', 'assignee_id'])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    public const REPEATS = ['none', 'daily', 'weekly', 'monthly'];

    /** How often a reminder repeats. Without one, it's sent once. */
    public const REMINDER_FREQUENCIES = ['daily', 'weekly', 'monthly'];

    /** A reminder is the clock time ("05:00") it goes out on the due date. */
    public const REMINDER_TIME_PATTERN = '([01]\d|2[0-3]):[0-5]\d';

    /** How much earlier an "early" reminder goes out than the time that was picked. */
    public const REMINDER_EARLY_MINUTES = 10;

    protected static function booted(): void
    {
        static::saving(function (Task $task): void {
            if ($task->reminder === null) {
                $task->reminder_frequency = null;
                $task->reminder_early = false;
            }

            if ($task->isDirty(['reminder', 'reminder_early', 'reminder_frequency', 'due_date', 'due_time', 'done'])) {
                $task->scheduleReminder();
            }
        });
    }

    /**
     * Work out `remind_at` (UTC) from the reminder's time on the due date, in the
     * owner's timezone.
     */
    public function scheduleReminder(): void
    {
        if ($this->reminder === null || $this->due_date === null || $this->done) {
            $this->remind_at = null;
            $this->reminded_at = null;

            return;
        }

        $this->remind_at = $this->reminderOn(CarbonImmutable::parse($this->due_date));
        $this->reminded_at = null;
    }

    /**
     * When the reminder goes out (UTC) for a given local date: at the picked time,
     * or 10 minutes before it when it's early.
     */
    public function reminderOn(CarbonImmutable $date): CarbonImmutable
    {
        $at = CarbonImmutable::parse("{$date->toDateString()} {$this->reminder}", $this->user?->timezone ?? 'UTC');

        if ($this->reminder_early) {
            $at = $at->subMinutes(self::REMINDER_EARLY_MINUTES);
        }

        return $at->utc();
    }

    /**
     * The next time a repeating reminder goes out after the given moment, counted from
     * the due date so monthly reminders keep their day (Jan 31, Feb 28, Mar 31).
     * Null for a reminder that's sent once.
     */
    public function nextReminderAfter(CarbonImmutable $moment): ?CarbonImmutable
    {
        $frequency = $this->repeat !== 'none' ? $this->repeat : $this->reminder_frequency;
        if (! in_array($frequency, self::REMINDER_FREQUENCIES, true) || $this->due_date === null) {
            return null;
        }

        $due = CarbonImmutable::parse($this->due_date);
        $occurrenceOn = fn (int $count): CarbonImmutable => match ($frequency) {
            'daily' => $due->addDays($count),
            'weekly' => $due->addWeeks($count),
            'monthly' => $due->addMonthsNoOverflow($count),
        };

        // Skip straight to roughly now, so a long-running daily reminder doesn't walk every day.
        $elapsed = (int) match ($frequency) {
            'daily' => $due->diffInDays($moment),
            'weekly' => $due->diffInWeeks($moment),
            'monthly' => $due->diffInMonths($moment),
        };
        $count = max(1, $elapsed - 1);

        while (($next = $this->reminderOn($occurrenceOn($count))) <= $moment) {
            $count++;
        }

        return $next;
    }

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'done' => false,
        'repeat' => 'none',
        'reminder_early' => false,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Who the task is assigned to, in a shared project.
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function completions(): HasMany
    {
        return $this->hasMany(TaskCompletion::class);
    }

    public function isReminderTask(): bool
    {
        return $this->reminder !== null;
    }

    /**
     * Auto-completes a reminder task at its scheduled time.
     * A repeating reminder is completed today and rolls forward to its next time;
     * a one-off reminder is marked done.
     */
    public function autoComplete(?string $completedOn = null): void
    {
        $user = $this->user;
        $completedOn = $completedOn ?? ($user?->timezone ? now($user->timezone)->toDateString() : now()->toDateString());

        DB::transaction(function () use ($completedOn, $user): void {
            $this->completions()->create([
                'user_id' => $user?->id ?? $this->user_id,
                'completed_on' => $completedOn,
            ]);

            $next = $this->nextReminderAfter(CarbonImmutable::now());
            if ($next) {
                $this->updateQuietly([
                    'remind_at' => $next,
                    'reminded_at' => null,
                    'completed_at' => now(),
                    'due_date' => $this->nextDueDate(),
                ]);
            } else {
                $this->updateQuietly([
                    'remind_at' => null,
                    'reminded_at' => now(),
                    'done' => true,
                    'completed_at' => now(),
                ]);
            }
        });
    }

    /**
     * Auto-complete all pending reminder tasks for a user whose remind_at time has arrived.
     */
    public static function autoCompleteDueRemindersFor(User $user): int
    {
        $dueTasks = $user->tasks()
            ->whereNotNull('reminder')
            ->whereNotNull('remind_at')
            ->whereNull('reminded_at')
            ->where('remind_at', '<=', now())
            ->where('done', false)
            ->get();

        foreach ($dueTasks as $task) {
            $task->autoComplete();
        }

        return $dueTasks->count();
    }

    /**
     * Repeating tasks with a due date roll forward instead of being marked done.
     */
    public function rollsForward(): bool
    {
        $hasRepeat = $this->repeat !== 'none';
        $hasReminderFrequency = in_array($this->reminder_frequency, self::REMINDER_FREQUENCIES, true);

        return ($hasRepeat || $hasReminderFrequency) && $this->due_date !== null && ! $this->done;
    }

    /**
     * The next due date for a repeating task. Monthly repeats clamp to the month's last day.
     */
    public function nextDueDate(): CarbonImmutable
    {
        $due = CarbonImmutable::parse($this->due_date);
        $frequency = $this->repeat !== 'none' ? $this->repeat : $this->reminder_frequency;

        return match ($frequency) {
            'daily' => $due->addDay(),
            'weekly' => $due->addWeek(),
            'monthly' => $due->addMonthNoOverflow(),
            default => $due,
        };
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'done' => 'boolean',
            'reminder_early' => 'boolean',
            'due_date' => 'date:Y-m-d',
            'completed_at' => 'datetime',
            'remind_at' => 'datetime',
            'reminded_at' => 'datetime',
        ];
    }
}
