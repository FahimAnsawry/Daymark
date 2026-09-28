<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProjectMemberController extends Controller
{
    /**
     * Who has access to a project: the owner, members, and invitations still waiting.
     */
    public function index(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $person = fn (User $user): array => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email];

        return response()->json([
            'owner' => $person($project->user),
            'members' => $project->members()->orderBy('name')->get()->map($person)->values(),
            'invitations' => $project->invitations()->whereNull('accepted_at')->latest()->get()
                ->map(fn ($invitation) => ['id' => $invitation->id, 'email' => $invitation->email])
                ->values(),
        ]);
    }

    /**
     * Remove someone from a project (or leave it). Their assignments in it are cleared.
     */
    public function destroy(Project $project, User $user): JsonResponse
    {
        Gate::authorize('removeMember', [$project, $user]);

        DB::transaction(function () use ($project, $user): void {
            $project->members()->detach($user->id);
            $project->tasks()->where('assignee_id', $user->id)->update(['assignee_id' => null]);
        });

        return response()->json(['message' => 'Removed from project']);
    }
}
