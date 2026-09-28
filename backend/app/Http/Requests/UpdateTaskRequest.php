<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Same rules as creating a task, but every field is optional.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_map(
            fn (array $rules): array => ['sometimes', ...$rules],
            [
                ...StoreTaskRequest::taskRules(),
                ...StoreTaskRequest::reminderRules(),
                'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            ],
        );
    }
}
