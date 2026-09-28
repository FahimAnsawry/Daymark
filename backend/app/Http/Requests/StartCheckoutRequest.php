<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StartCheckoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The card details are only what the simulated checkout shows back (brand and last four).
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'plan' => ['required', 'in:plus,pro'],
            'period' => ['required', 'in:monthly,yearly'],
            'card_brand' => ['nullable', 'in:visa,mastercard,amex'],
            'card_last4' => ['nullable', 'digits:4'],
        ];
    }
}
