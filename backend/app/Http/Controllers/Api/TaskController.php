<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureUserHasPlan;
use App\Http\Requests\CompleteTaskRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\User;
use App\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        Task::autoCompleteDueRemindersFor($user);

        $tasks = $user->visibleTasks()->with(['project', 'assignee'])->orderBy('id')->get();

        return TaskResource::collection($tasks);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $user = $request->user();

        if (self::wantsReminderWithoutPlus($request->validated(), $user)) {
            return EnsureUserHasPlan::upgradeRequired(Plan::Plus);
        }

        $task = $user->tasks()->create(self::attributesFrom($request->validated(), $user));

        return (new TaskResource($task->load(['project', 'assignee'])))->response()->setStatusCode(201);
    }

    public function update(UpdateTaskRequest $request, Task $task): TaskResource|JsonResponse
    {
        Gate::authorize('update', $task);

        if ($task->isReminderTask() && array_key_exists('reminder', $request->validated()) && $request->validated('reminder') === null) {
            return response()->json([
                'message' => 'Reminders cannot be removed from a reminder task.',
                'errors' => ['reminder' => ['Reminders cannot be removed from a reminder task.']],
            ], 422);
        }

        if (self::wantsReminderWithoutPlus($request->validated(), $request->user())) {
            return EnsureUserHasPlan::upgradeRequired(Plan::Plus);
        }

        $attributes = self::attributesFrom($request->validated(), $request->user());

        if (array_key_exists('assignee_id', $request->validated())) {
            $assigneeId = $request->validated('assignee_id');
            $project = $task->project;

            if ($assigneeId !== null && ! ($project && $project->isAccessibleBy(User::findOrFail($assigneeId)))) {
                return response()->json([
                    'message' => 'Tasks can only be assigned to people in a shared project.',
                    'errors' => ['assignee_id' => ['Tasks can only be assigned to people in a shared project.']],
                ], 422);
            }

            $attributes['assignee_id'] = $assigneeId;
        }

        $task->update($attributes);

        return new TaskResource($task->load(['project', 'assignee']));
    }

    /**
     * Setting a reminder needs Plus; clearing one never does.
     *
     * @param  array<string, mixed>  $data
     */
    private static function wantsReminderWithoutPlus(array $data, User $user): bool
    {
        return ($data['reminder'] ?? null) !== null && ! $user->hasPlan(Plan::Plus);
    }

    /**
     * Complete or reopen a task. A repeating task with a due date rolls forward instead
     * of being marked done. Every completion is logged for reporting.
     * Reminder tasks cannot be manually completed; they auto-complete at their scheduled time.
     */
    public function complete(CompleteTaskRequest $request, Task $task): TaskResource|JsonResponse
    {
        Gate::authorize('update', $task);

        if ($task->isReminderTask()) {
            return response()->json([
                'message' => 'Reminder tasks cannot be manually completed. They are automatically completed at their scheduled time.',
                'errors' => ['task' => ['Reminder tasks cannot be manually completed. They are automatically completed at their scheduled time.']],
            ], 422);
        }

        $completedOn = $request->validated('completed_on');

        $isFinishing = $task->rollsForward()
            ? ! $task->completions()->where('completed_on', $completedOn)->exists()
            : ! $task->done;

        // Reopening is always fine; finishing waits until the focus session on this task ends.
        if ($isFinishing && $request->user()->focusSessions()->whereNull('ended_at')->where('task_id', $task->id)->exists()) {
            return response()->json([
                'message' => 'Finish your focus session before completing this task.',
                'errors' => ['task' => ['Finish your focus session before completing this task.']],
            ], 422);
        }

        // Completions count for whoever did the task, which in a shared project may not be its creator.
        $completedBy = $request->user()->id;

        DB::transaction(function () use ($task, $completedOn, $completedBy): void {
            $existingTodayCompletion = $task->completions()
                ->where('completed_on', $completedOn)
                ->latest('id')
                ->first();

            if ($task->rollsForward()) {
                if ($existingTodayCompletion) {
                    $existingTodayCompletion->delete();
                    $task->update([
                        'due_date' => $completedOn,
                        'completed_at' => null,
                        'done' => false,
                    ]);
                } else {
                    $task->completions()->create(['user_id' => $completedBy, 'completed_on' => $completedOn]);
                    $task->update([
                        'due_date' => $task->nextDueDate(),
                        'completed_at' => now(),
                        'done' => false,
                    ]);
                }
            } elseif (! $task->done) {
                $task->completions()->create(['user_id' => $completedBy, 'completed_on' => $completedOn]);
                $task->update(['done' => true, 'completed_at' => now()]);
            } else {
                $task->completions()->latest('id')->first()?->delete();
                $task->update(['done' => false, 'completed_at' => null]);
            }
        });

        return new TaskResource($task->load(['project', 'assignee']));
    }

    /**
     * Auto-complete a reminder task when its scheduled time arrives.
     */
    public function autoComplete(Request $request, Task $task): TaskResource|JsonResponse
    {
        Gate::authorize('update', $task);

        if (! $task->isReminderTask()) {
            return response()->json([
                'message' => 'Only reminder tasks can be auto-completed.',
                'errors' => ['task' => ['Only reminder tasks can be auto-completed.']],
            ], 422);
        }

        $completedOn = $request->input('completed_on');
        $task->autoComplete($completedOn);

        return new TaskResource($task->fresh()->load(['project', 'assignee']));
    }

    public function destroy(Task $task): JsonResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return response()->json(['message' => 'Task deleted']);
    }

    /**
     * Map the dashboard's task fields to columns. Only keys that were sent are included.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function attributesFrom(array $data, User $user): array
    {
        $columns = ['title' => 'title', 'due' => 'due_date', 'time' => 'due_time', 'label' => 'label', 'reminder' => 'reminder', 'reminder_early' => 'reminder_early', 'reminder_frequency' => 'reminder_frequency'];
        $attributes = [];

        foreach ($columns as $field => $column) {
            if (array_key_exists($field, $data)) {
                $attributes[$column] = $data[$field];
            }
        }

        if (array_key_exists('repeat', $data)) {
            $attributes['repeat'] = $data['repeat'] ?? 'none';
        }

        if (array_key_exists('project', $data)) {
            $attributes['project_id'] = $user->projectIdFor($data['project']);
        }

        return $attributes;
    }
}
