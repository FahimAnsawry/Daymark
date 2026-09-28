<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class TaskReportRequest extends FormRequest
{
    public const MAX_DAYS = 400;

    /** Without Pro, reports cover at most one week (from and to inclusive). */
    public const FREE_MAX_DAYS = 7;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * `today` is the client's local date, used to count overdue tasks.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'group' => ['required', 'in:day,week'],
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
            'today' => ['required', 'date_format:Y-m-d'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $days = CarbonImmutable::parse($this->input('from'))->diffInDays($this->input('to'));
                if ($days > self::MAX_DAYS) {
                    $validator->errors()->add('to', 'The report range may not exceed '.self::MAX_DAYS.' days.');
                }
            },
        ];
    }
}
