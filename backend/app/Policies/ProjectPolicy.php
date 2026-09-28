<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function view(User $user, Project $project): bool
    {
        return $project->isAccessibleBy($user);
    }

    public function update(User $user, Project $project): bool
    {
        return $project->isOwnedBy($user);
    }

    public function delete(User $user, Project $project): bool
    {
        return $project->isOwnedBy($user);
    }

    /**
     * Only the owner invites people or removes them; anyone can remove themselves.
     */
    public function share(User $user, Project $project): bool
    {
        return $project->isOwnedBy($user);
    }

    public function removeMember(User $user, Project $project, User $member): bool
    {
        return $project->isOwnedBy($user) || $user->is($member);
    }
}
