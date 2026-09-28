<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Mail\ProjectInvitationMail;
use App\Models\Project;
use App\Models\ProjectInvitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProjectInvitationController extends Controller
{
    /**
     * Invite someone by email. Inviting the same address again resends the pending invitation.
     */
    public function store(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('share', $project);

        $email = strtolower(trim($request->validate(['email' => ['required', 'email', 'max:255']])['email']));

        if (strcasecmp($email, $project->user->email) === 0 || $project->members()->where('email', $email)->exists()) {
            throw ValidationException::withMessages(['email' => 'This person already has access.']);
        }

        $invitation = $project->invitations()->whereNull('accepted_at')->firstOrCreate(
            ['email' => $email],
            ['invited_by' => $request->user()->id, 'token' => Str::random(64)],
        );

        Mail::to($email)->queue(new ProjectInvitationMail($invitation));

        return response()->json(['id' => $invitation->id, 'email' => $invitation->email], 201);
    }

    public function destroy(Project $project, ProjectInvitation $invitation): JsonResponse
    {
        Gate::authorize('share', $project);
        abort_unless($invitation->project_id === $project->id, 404);

        $invitation->delete();

        return response()->json(['message' => 'Invitation cancelled']);
    }

    /**
     * What an invitation link is for, so the SPA can ask before joining.
     */
    public function show(Request $request, string $token): JsonResponse
    {
        $invitation = ProjectInvitation::where('token', $token)->with(['project', 'inviter'])->firstOrFail();

        return response()->json([
            'project' => $invitation->project->name,
            'invited_by' => $invitation->inviter->name,
            'email' => $invitation->email,
            'accepted' => $invitation->accepted_at !== null,
            'is_for_you' => $invitation->isFor($request->user()),
        ]);
    }

    /**
     * Join the project. Only the account the invitation was sent to can accept it.
     */
    public function accept(Request $request, string $token): JsonResponse
    {
        $user = $request->user();
        $invitation = ProjectInvitation::where('token', $token)->with('project')->firstOrFail();

        if (! $invitation->isFor($user)) {
            return response()->json([
                'message' => "This invitation was sent to {$invitation->email}. Sign in with that email to accept it.",
            ], 403);
        }

        $project = $invitation->project;

        if (! $project->isOwnedBy($user)) {
            $project->members()->syncWithoutDetaching([$user->id]);
        }

        $invitation->update(['accepted_at' => $invitation->accepted_at ?? now()]);

        return (new ProjectResource($project->loadCount(['tasks', 'members'])->load('user')))->response();
    }
}
