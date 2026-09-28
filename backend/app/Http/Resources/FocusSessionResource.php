<?php

namespace App\Http\Resources;

use App\Models\FocusSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin FocusSession
 */
class FocusSessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'task_title' => $this->task?->title,
            'planned_minutes' => $this->planned_minutes,
            'started_at' => $this->started_at->toIso8601String(),
            'ended_at' => $this->ended_at?->toIso8601String(),
            'focused_seconds' => $this->focused_seconds,
        ];
    }
}
