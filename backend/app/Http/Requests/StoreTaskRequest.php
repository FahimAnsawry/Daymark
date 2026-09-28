<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [...self::taskRules(), ...self::reminderRules()];
    }

    /**
     * Reminders are a Plus feature, set on the dashboard only (never imported). A reminder
     * is the clock time ("05:00") it goes out on the due date, optionally 10 minutes
     * early, and it repeats at `reminder_frequency` (sent once when there isn't one).
     *
     * @return array<string, array<mixed>>
     */
    public static function reminderRules(): array
    {
        return [
            'reminder' => ['nullable', 'string', 'regex:/^'.Task::REMINDER_TIME_PATTERN.'$/'],
            'reminder_early' => ['sometimes', 'boolean'],
            'reminder_frequency' => ['nullable', Rule::in(Task::REMINDER_FREQUENCIES)],
        ];
    }

    /**
     * Rules for one task in the dashboard's shape. Shared by update and import.
     *
     * @return array<string, array<mixed>>
     */
    public static function taskRules(string $prefix = ''): array
    {
        return [
            $prefix.'title' => ['required', 'string', 'max:255'],
            $prefix.'due' => ['nullable', 'date_format:Y-m-d'],
            $prefix.'time' => ['nullable', 'date_format:H:i'],
            $prefix.'project' => ['nullable', 'string', 'max:255'],
            $prefix.'label' => ['nullable', 'string', 'max:255'],
            $prefix.'repeat' => ['nullable', Rule::in(Task::REPEATS)],
        ];
    }
}
