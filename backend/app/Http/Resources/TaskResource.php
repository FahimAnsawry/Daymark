<?php

namespace App\Http\Resources;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Task
 */
class TaskResource extends JsonResource
{
    /**
     * Uses the same field names as the dashboard's task objects.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'title' => $this->title,
            'done' => $this->done,
            'due' => $this->due_date?->format('Y-m-d') ?? '',
            'time' => $this->due_time ?? '',
            'project' => $this->project?->name ?? '',
            'project_id' => $this->project_id,
            'assignee' => $this->assignee ? ['id' => $this->assignee->id, 'name' => $this->assignee->name] : null,
            'label' => $this->label ?? '',
            'repeat' => $this->repeat,
            'reminder' => $this->reminder,
            'reminder_early' => $this->reminder_early,
            'reminder_frequency' => $this->reminder_frequency,
            'remind_at' => $this->remind_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at,
        ];
    }
}
