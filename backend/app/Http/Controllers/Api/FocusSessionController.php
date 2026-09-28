<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StartFocusSessionRequest;
use App\Http\Resources\FocusSessionResource;
use App\Models\FocusSession;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class FocusSessionController extends Controller
{
    /**
     * The running session, if any, so a reload can pick the timer back up.
     */
    public function current(Request $request): JsonResponse
    {
        $session = $request->user()->focusSessions()->whereNull('ended_at')->with('task')->latest('started_at')->first();

        return response()->json(['data' => $session ? new FocusSessionResource($session) : null]);
    }

    /**
     * Start a session. Any session still running is finished first, so there's only ever one.
     */
    public function store(StartFocusSessionRequest $request): JsonResponse
    {
        $user = $request->user();
        $taskId = $request->validated('task_id');

        if ($taskId !== null) {
            $task = Task::findOrFail($taskId);
            Gate::authorize('update', $task);

            if ($task->isReminderTask()) {
                return response()->json([
                    'message' => 'Reminder tasks cannot be used for focus sessions.',
                    'errors' => ['task_id' => ['Reminder tasks cannot be used for focus sessions.']],
                ], 422);
            }
        }

        $session = DB::transaction(function () use ($user, $request, $taskId): FocusSession {
            $user->focusSessions()->whereNull('ended_at')->get()->each->finish();

            return $user->focusSessions()->create([
                'task_id' => $taskId,
                'planned_minutes' => $request->validated('planned_minutes'),
                'started_at' => now(),
            ]);
        });

        return (new FocusSessionResource($session->load('task')))->response()->setStatusCode(201);
    }

    /**
     * Finish a session with the time the browser counted (pauses excluded).
     */
    public function update(Request $request, FocusSession $focusSession): FocusSessionResource
    {
        Gate::authorize('update', $focusSession);

        $validated = $request->validate(['focused_seconds' => ['required', 'integer', 'min:0']]);

        if ($focusSession->isRunning()) {
            $focusSession->finish($validated['focused_seconds']);
        }

        return new FocusSessionResource($focusSession->load('task'));
    }
}
