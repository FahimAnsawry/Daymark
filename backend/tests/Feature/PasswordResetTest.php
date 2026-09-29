<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_link_points_at_the_frontend_reset_page(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])->assertOk();

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
            $url = $notification->toMail($user)->actionUrl;

            return str_starts_with($url, config('app.frontend_url').'/reset-password?token=')
                && str_contains($url, 'email='.urlencode($user->email));
        });
    }

    public function test_unknown_email_is_told_it_has_no_account_and_gets_no_mail(): void
    {
        Notification::fake();

        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', "This email doesn't belong to any account.");

        Notification::assertNothingSent();
    }

    public function test_asking_again_straight_away_is_told_to_wait(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])->assertOk();
        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        Notification::assertCount(1);
    }

    public function test_forgot_password_requires_a_valid_email(): void
    {
        $this->postJson('/api/auth/forgot-password', ['email' => 'nope'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_password_can_be_reset_and_old_sessions_are_ended(): void
    {
        $user = User::factory()->create();
        $user->createToken('auth-token');
        $token = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'a-new-password',
            'password_confirmation' => 'a-new-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('a-new-password', $user->passwordAccount()->first()->password_hash));
        $this->assertSame(0, $user->tokens()->count());
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'a-new-password'])->assertOk();
    }

    public function test_reset_link_can_only_be_used_once(): void
    {
        $user = User::factory()->create();
        $payload = [
            'token' => Password::createToken($user),
            'email' => $user->email,
            'password' => 'a-new-password',
            'password_confirmation' => 'a-new-password',
        ];

        $this->postJson('/api/auth/reset-password', $payload)->assertOk();
        $this->postJson('/api/auth/reset-password', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_invalid_token_is_rejected_and_password_is_unchanged(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/reset-password', [
            'token' => 'not-a-real-token',
            'email' => $user->email,
            'password' => 'a-new-password',
            'password_confirmation' => 'a-new-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertTrue(Hash::check('password', $user->passwordAccount()->first()->password_hash));
    }

    public function test_new_password_must_be_confirmed_and_strong_enough(): void
    {
        $user = User::factory()->create();
        $token = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'short',
            'password_confirmation' => 'different',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_google_only_user_can_set_a_password_through_a_reset(): void
    {
        $user = User::factory()->create();
        $user->passwordAccount()->delete();
        $user->linkVerifiedGoogleAccount('google-123');

        $this->postJson('/api/auth/reset-password', [
            'token' => Password::createToken($user),
            'email' => $user->email,
            'password' => 'a-new-password',
            'password_confirmation' => 'a-new-password',
        ])->assertOk();

        $this->assertDatabaseHas('accounts', ['user_id' => $user->id, 'provider' => Account::PROVIDER_PASSWORD]);
        $this->assertDatabaseHas('accounts', ['user_id' => $user->id, 'provider' => Account::PROVIDER_GOOGLE]);
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'a-new-password'])->assertOk();
    }
}
