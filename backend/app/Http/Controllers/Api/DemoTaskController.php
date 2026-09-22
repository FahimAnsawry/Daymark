<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Resources\TaskResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DemoTaskController extends Controller
{
    /**
     * In-memory / cache fallback tasks for demonstration.
     */
    private static array $tasks = [
        [
            'id' => 1,
            'title' => 'Configure PostgreSQL database',
            'description' => 'Update DB_PASSWORD in backend/.env to connect to your local PostgreSQL instance.',
            'completed' => false,
            'tag' => 'Database',
            'created_at' => '2026-09-20 15:00:00',
        ],
        [
            'id' => 2,
            'title' => 'Explore TanStack Router routes',
            'description' => 'Routes are defined with full type safety under frontend/src/routes.',
            'completed' => true,
            'tag' => 'Frontend',
            'created_at' => '2026-09-20 15:05:00',
        ],
        [
            'id' => 3,
            'title' => 'State Management with TanStack Query',
            'description' => 'Automatic caching, background refetching, and optimistic mutations enabled.',
            'completed' => true,
            'tag' => 'State',
            'created_at' => '2026-09-20 15:10:00',
        ],
    ];

    /**
     * Get all demo tasks.
     */
    public function index(): AnonymousResourceCollection
    {
        $tasks = session()->get('demo_tasks', self::$tasks);

        return TaskResource::collection(collect($tasks));
    }

    /**
     * Create a demo task.
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $tasks = session()->get('demo_tasks', self::$tasks);
        $newTask = [
            'id' => count($tasks) > 0 ? max(array_column($tasks, 'id')) : 0,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'completed' => false,
            'tag' => $validated['tag'] ?? 'General',
            'created_at' => now()->format('Y-m-d H:i:s'),
        ];
        $newTask['id'] += 1;

        array_unshift($tasks, $newTask);
        session()->put('demo_tasks', $tasks);

        return (new TaskResource($newTask))
            ->additional(['message' => 'Task created successfully'])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Toggle completion status.
     */
    public function toggle(int $id): JsonResponse
    {
        $tasks = session()->get('demo_tasks', self::$tasks);
        $updated = null;

        foreach ($tasks as &$task) {
            if ($task['id'] === $id) {
                $task['completed'] = ! $task['completed'];
                $updated = $task;
                break;
            }
        }

        if (! $updated) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        session()->put('demo_tasks', $tasks);

        return (new TaskResource($updated))
            ->additional(['message' => 'Task updated successfully'])
            ->response();
    }

    /**
     * Delete a task.
     */
    public function destroy(int $id): JsonResponse
    {
        $tasks = session()->get('demo_tasks', self::$tasks);
        $tasks = array_values(array_filter($tasks, fn($t) => $t['id'] !== $id));
        session()->put('demo_tasks', $tasks);

        return response()->json([
            'message' => 'Task deleted successfully',
        ]);
    }
}
