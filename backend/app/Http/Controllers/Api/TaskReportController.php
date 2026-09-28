<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureUserHasPlan;
use App\Http\Requests\TaskReportRequest;
use App\Models\User;
use App\Plan;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;

class TaskReportController extends Controller
{
    /**
     * Completed tasks per day or week (buckets are zero-filled), plus open/overdue totals
     * and completions per project. Grouping happens in PHP so it works on any database.
     */
    public function __invoke(TaskReportRequest $request): JsonResponse
    {
        $user = $request->user();
        $group = $request->validated('group');
        $to = CarbonImmutable::parse($request->validated('to'));
        $from = CarbonImmutable::parse($request->validated('from'));

        $isPro = $user->hasPlan(Plan::Pro);

        if (! $isPro && $from->diffInDays($to) >= TaskReportRequest::FREE_MAX_DAYS) {
            return EnsureUserHasPlan::upgradeRequired(Plan::Pro);
        }

        if ($group === 'week') {
            $from = $from->startOfWeek(CarbonInterface::MONDAY);
        }

        $completions = $user->taskCompletions()
            ->whereBetween('completed_on', [$from->toDateString(), $to->toDateString()])
            ->with('task.project')
            ->get();

        $bucketKey = fn (CarbonInterface $date): string => $group === 'week'
            ? $date->startOfWeek(CarbonInterface::MONDAY)->toDateString()
            : $date->toDateString();

        $counts = $completions->countBy(fn ($completion) => $bucketKey($completion->completed_on));

        $buckets = [];
        for ($date = $from; $date->lte($to); $date = $group === 'week' ? $date->addWeek() : $date->addDay()) {
            $key = $date->toDateString();
            $buckets[] = ['start' => $key, 'completed' => $counts->get($key, 0)];
        }

        $byProject = $completions
            ->countBy(fn ($completion) => $completion->task->project?->name ?? '')
            ->map(fn (int $count, string $name) => ['project' => $name, 'completed' => $count])
            ->sortByDesc('completed')
            ->values();

        $openTasks = $user->tasks()->where('done', false);

        return response()->json([
            'group' => $group,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'buckets' => $buckets,
            'totals' => [
                'completed' => $completions->count(),
                'open' => (clone $openTasks)->count(),
                'overdue' => (clone $openTasks)->where('due_date', '<', $request->validated('today'))->count(),
            ],
            'by_project' => $byProject,
            'streak' => $isPro ? $this->streak($user, CarbonImmutable::parse($request->validated('today'))) : null,
            'focus_minutes' => $user->hasPlan(Plan::Plus) ? $this->focusMinutes($user, $from, $to) : null,
        ]);
    }

    /**
     * Focused minutes in sessions that started within the range, in the user's timezone.
     */
    private function focusMinutes(User $user, CarbonImmutable $from, CarbonImmutable $to): int
    {
        $start = CarbonImmutable::parse($from->toDateString(), $user->timezone)->startOfDay()->utc();
        $end = CarbonImmutable::parse($to->toDateString(), $user->timezone)->endOfDay()->utc();

        $seconds = $user->focusSessions()->whereBetween('started_at', [$start, $end])->sum('focused_seconds');

        return intdiv((int) $seconds, 60);
    }

    /**
     * Days in a row, ending today, with at least one completion. A day with nothing done
     * yet doesn't break the streak until it's over, so the count may end yesterday.
     */
    private function streak(User $user, CarbonImmutable $today): int
    {
        $days = $user->taskCompletions()
            ->toBase()
            ->distinct()
            ->orderByDesc('completed_on')
            ->limit(TaskReportRequest::MAX_DAYS)
            ->pluck('completed_on')
            ->map(fn (string $date): string => CarbonImmutable::parse($date)->toDateString())
            ->flip();

        $day = $days->has($today->toDateString()) ? $today : $today->subDay();
        $streak = 0;

        while ($days->has($day->toDateString())) {
            $streak++;
            $day = $day->subDay();
        }

        return $streak;
    }
}
