<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_stores_password_credentials_in_an_account(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertCreated();

        $user = User::where('email', 'ada@example.com')->firstOrFail();
        $this->assertSame('Ada Lovelace', $user->name);
        $this->assertDatabaseHas('accounts', [
            'user_id' => $user->id,
            'provider' => Account::PROVIDER_PASSWORD,
        ]);
        $this->assertTrue(Hash::check('password', $user->passwordAccount->password_hash));
        $this->assertArrayNotHasKey('password', $user->toArray());
    }

    public function test_password_login_reads_the_password_account(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_one_user_can_have_password_and_google_login_accounts(): void
    {
        $user = User::factory()->create(['email' => 'same@gmail.com']);

        $user->linkVerifiedGoogleAccount('google-subject-old');
        $user->linkVerifiedGoogleAccount('google-subject-123');

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('accounts', 2);
        $this->assertDatabaseHas('accounts', [
            'user_id' => $user->id,
            'provider' => Account::PROVIDER_PASSWORD,
        ]);
        $this->assertDatabaseHas('accounts', [
            'user_id' => $user->id,
            'provider' => Account::PROVIDER_GOOGLE,
            'provider_id' => 'google-subject-123',
        ]);
    }

    public function test_google_only_user_cannot_log_in_with_a_password(): void
    {
        $user = User::create([
            'name' => 'Grace Hopper',
            'email' => 'grace@gmail.com',
        ]);
        $user->accounts()->create([
            'provider' => Account::PROVIDER_GOOGLE,
            'provider_id' => 'google-subject-456',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'grace@gmail.com',
            'password' => 'password',
        ])->assertUnprocessable()->assertJsonPath('message', 'Invalid email or password');
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $response->assertOk()
            ->assertJsonPath('message', 'Successfully logged out');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_me_endpoint_returns_authenticated_user(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_oauth_redirect_returns_json_target_url(): void
    {
        $providerMock = \Mockery::mock(\Laravel\Socialite\Two\AbstractProvider::class);
        $redirectMock = \Mockery::mock(\Symfony\Component\HttpFoundation\RedirectResponse::class);
        $redirectMock->shouldReceive('getTargetUrl')->andReturn('https://accounts.google.com/o/oauth2/auth');
        $providerMock->shouldReceive('stateless->redirect')->andReturn($redirectMock);

        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver')->with('google')->andReturn($providerMock);

        $response = $this->getJson('/api/auth/google/redirect');

        $response->assertOk()
            ->assertJson(['url' => 'https://accounts.google.com/o/oauth2/auth']);
    }

    public function test_oauth_callback_creates_and_authenticates_new_google_user(): void
    {
        $socialiteUser = \Mockery::mock(\Laravel\Socialite\Contracts\User::class);
        $socialiteUser->shouldReceive('getId')->andReturn('google-unique-sub-999');
        $socialiteUser->shouldReceive('getEmail')->andReturn('newgoogle@example.com');
        $socialiteUser->shouldReceive('getName')->andReturn('Google Explorer');
        $socialiteUser->shouldReceive('getNickname')->andReturn('explorer');

        $providerMock = \Mockery::mock(\Laravel\Socialite\Two\AbstractProvider::class);
        $providerMock->shouldReceive('stateless->user')->andReturn($socialiteUser);

        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver')->with('google')->andReturn($providerMock);

        $response = $this->getJson('/api/auth/google/callback');

        $response->assertOk()
            ->assertJsonPath('message', 'Login successful')
            ->assertJsonPath('user.email', 'newgoogle@example.com')
            ->assertJsonStructure(['token', 'user']);

        $user = User::where('email', 'newgoogle@example.com')->firstOrFail();
        $this->assertDatabaseHas('accounts', [
            'user_id' => $user->id,
            'provider' => Account::PROVIDER_GOOGLE,
            'provider_id' => 'google-unique-sub-999',
        ]);
    }

    public function test_oauth_callback_links_to_existing_password_user(): void
    {
        $user = User::factory()->create(['email' => 'existing@example.com']);

        $socialiteUser = \Mockery::mock(\Laravel\Socialite\Contracts\User::class);
        $socialiteUser->shouldReceive('getId')->andReturn('google-linked-id');
        $socialiteUser->shouldReceive('getEmail')->andReturn('existing@example.com');
        $socialiteUser->shouldReceive('getName')->andReturn('Existing User');
        $socialiteUser->shouldReceive('getNickname')->andReturn('existing');

        $providerMock = \Mockery::mock(\Laravel\Socialite\Two\AbstractProvider::class);
        $providerMock->shouldReceive('stateless->user')->andReturn($socialiteUser);

        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver')->with('google')->andReturn($providerMock);

        $response = $this->getJson('/api/auth/google/callback');

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id);

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('accounts', [
            'user_id' => $user->id,
            'provider' => Account::PROVIDER_GOOGLE,
            'provider_id' => 'google-linked-id',
        ]);
    }

    public function test_unsupported_oauth_provider_returns_not_found(): void
    {
        $this->getJson('/api/auth/facebook/redirect')->assertNotFound();
    }
}
