<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = is_array($this->resource) ? $this->resource : (array) $this->resource;

        return [
            'id' => $data['id'] ?? $this->id,
            'title' => $data['title'] ?? $this->title,
            'description' => $data['description'] ?? $this->description ?? '',
            'completed' => (bool) ($data['completed'] ?? $this->completed),
            'tag' => $data['tag'] ?? $this->tag ?? 'General',
            'created_at' => $data['created_at'] ?? $this->created_at,
        ];
    }
}
