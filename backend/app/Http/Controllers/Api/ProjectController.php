<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProjectController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $own = $user->projects()->withCount(['tasks', 'members'])->get();
        $shared = $user->sharedProjects()->with('user')->withCount(['tasks', 'members'])->get();

        return ProjectResource::collection($own->concat($shared)->sortBy('id')->values());
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = $request->user()->projects()->firstOrCreate([
            'name' => trim($request->validated('name')),
        ]);

        return (new ProjectResource($project->loadCount('tasks')))
            ->response()
            ->setStatusCode($project->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Deleting a project also deletes its tasks. The dashboard confirms this first.
     */
    public function destroy(Project $project): JsonResponse
    {
        Gate::authorize('delete', $project);

        DB::transaction(function () use ($project): void {
            $project->tasks()->delete();
            $project->delete();
        });

        return response()->json(['message' => 'Project deleted']);
    }
}
