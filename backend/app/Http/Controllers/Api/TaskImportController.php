<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportTasksRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TaskImportController extends Controller
{
    /**
     * Copy tasks and projects saved in the browser into the database. Tasks are keyed by
     * their browser id (client_id), so sending the same data twice doesn't duplicate it.
     */
    public function __invoke(ImportTasksRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $imported = DB::transaction(function () use ($user, $validated): int {
            foreach ($validated['projects'] as $name) {
                $user->projectIdFor($name);
            }

            $existing = $user->tasks()->whereNotNull('client_id')->pluck('client_id')->flip();
            $imported = 0;

            foreach ($validated['tasks'] as $task) {
                if ($existing->has($task['client_id'])) {
                    continue;
                }

                $done = (bool) ($task['done'] ?? false);

                $user->tasks()->create([
                    ...TaskController::attributesFrom($task, $user),
                    'client_id' => $task['client_id'],
                    'done' => $done,
                    'completed_at' => $done ? now() : null,
                ]);
                $imported++;
            }

            return $imported;
        });

        return response()->json(['imported' => $imported]);
    }
}
