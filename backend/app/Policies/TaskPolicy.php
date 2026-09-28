<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Tasks in a shared project can be edited by everyone the project is shared with.
     */
    public function update(User $user, Task $task): bool
    {
        return $task->user_id === $user->id || (bool) $task->project?->isAccessibleBy($user);
    }

    public function delete(User $user, Task $task): bool
    {
        return $this->update($user, $task);
    }
}
