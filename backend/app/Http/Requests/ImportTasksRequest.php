<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ImportTasksRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Tasks and projects copied from the browser's localStorage.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'projects' => ['present', 'array', 'max:500'],
            'projects.*' => ['string', 'max:255'],
            'tasks' => ['present', 'array', 'max:5000'],
            'tasks.*.client_id' => ['required', 'string', 'max:64', 'distinct'],
            'tasks.*.done' => ['boolean'],
            ...StoreTaskRequest::taskRules('tasks.*.'),
        ];
    }
}
