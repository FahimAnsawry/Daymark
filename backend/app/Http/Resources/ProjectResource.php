<?php

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Project
 */
class ProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isOwner = $this->user_id === $request->user()?->id;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'tasks_count' => $this->whenCounted('tasks'),
            'members_count' => $this->whenCounted('members'),
            'is_owner' => $isOwner,
            'owner_name' => $this->when(! $isOwner, fn () => $this->user->name),
        ];
    }
}
