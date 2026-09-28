<?php

namespace App\Models;

use Database\Factories\FocusSessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A timed stretch of focus, optionally on one task. Pauses happen in the browser, so
 * `focused_seconds` (capped at the wall-clock time) is what counts, not ended - started.
 */
#[Fillable(['user_id', 'task_id', 'planned_minutes', 'started_at', 'ended_at', 'focused_seconds'])]
class FocusSession extends Model
{
    /** @use HasFactory<FocusSessionFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function isRunning(): bool
    {
        return $this->ended_at === null;
    }

    /**
     * End the session, counting at most the time that has actually passed.
     */
    public function finish(?int $focusedSeconds = null): void
    {
        $elapsed = (int) $this->started_at->diffInSeconds(now());

        $this->update([
            'ended_at' => now(),
            'focused_seconds' => min($focusedSeconds ?? $elapsed, $elapsed),
        ]);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }
}
