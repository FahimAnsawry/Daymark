<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Validation\Rules\Password;

class PasswordResetController extends Controller
{
    /**
     * Email a password reset link, or say plainly that the address has no account.
     */
    public function forgot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $status = PasswordBroker::sendResetLink($validated);

        if ($status === PasswordBroker::INVALID_USER) {
            return $this->emailError("This email doesn't belong to any account.");
        }

        if ($status === PasswordBroker::RESET_THROTTLED) {
            return $this->emailError('A reset link was just sent. Please wait a minute before asking for another.');
        }

        return response()->json([
            'message' => 'A reset link is on its way.',
        ]);
    }

    /**
     * Set a new password from an emailed link. Someone who only signed in with Google has no
     * password account yet, so this creates one. Every signed-in session is ended.
     */
    public function reset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        $status = PasswordBroker::reset($validated, function (User $user, string $password): void {
            DB::transaction(function () use ($user, $password): void {
                $user->accounts()->updateOrCreate(
                    ['provider' => Account::PROVIDER_PASSWORD],
                    ['password_hash' => Hash::make($password)],
                );

                $user->tokens()->delete();
            });

            event(new PasswordReset($user));
        });

        if ($status !== PasswordBroker::PASSWORD_RESET) {
            return $this->emailError('This reset link is invalid or has expired. Request a new one.');
        }

        return response()->json([
            'message' => 'Your password has been reset. You can sign in now.',
        ]);
    }

    private function emailError(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'errors' => ['email' => [$message]],
        ], 422);
    }
}
