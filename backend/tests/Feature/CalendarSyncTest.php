<?php

namespace Tests\Feature;

use App\Models\CalendarConnection;
use App\Models\User;
use App\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class CalendarSyncTest extends TestCase
{
    use RefreshDatabase;

    private function googleEvents(): array
    {
        return ['items' => [
            ['id' => 'a', 'summary' => 'Standup', 'start' => ['dateTime' => '2026-10-01T09:00:00+06:00'], 'end' => ['dateTime' => '2026-10-01T09:15:00+06:00']],
            ['id' => 'b', 'summary' => 'Holiday', 'start' => ['date' => '2026-10-01'], 'end' => ['date' => '2026-10-02']],
            ['id' => 'c', 'status' => 'cancelled', 'start' => ['dateTime' => '2026-10-01T10:00:00+06:00'], 'end' => ['dateTime' => '2026-10-01T11:00:00+06:00']],
        ]];
    }

    public function test_connecting_and_events_need_pro(): void
    {
        Sanctum::actingAs(User::factory()->subscribed(Plan::Plus)->create());

        $this->postJson('/api/calendar/google/connect')->assertPaymentRequired();
        $this->getJson('/api/calendar/events?date=2026-10-01')->assertPaymentRequired();
        $this->getJson('/api/calendar')->assertOk()->assertJsonPath('connected', false);
    }

    public function test_connect_returns_a_read_only_google_consent_url(): void
    {
        config(['services.google.client_id' => 'client-id']);
        Sanctum::actingAs(User::factory()->subscribed(Plan::Pro)->create());

        $url = $this->postJson('/api/calendar/google/connect')->assertOk()->json('url');

        $this->assertStringContainsString('accounts.google.com', $url);
        $this->assertStringContainsString(urlencode(CalendarConnection::SCOPE), $url);
        $this->assertStringContainsString('access_type=offline', $url);
        $this->assertStringContainsString('state=', $url);
    }

    public function test_callback_saves_the_connection_for_the_user_in_state(): void
    {
        $user = User::factory()->subscribed(Plan::Pro)->create();
        Socialite::fake('google', (new SocialiteUser)
            ->map(['id' => 'g-1', 'email' => 'sam@gmail.com'])
            ->setToken('access')
            ->setRefreshToken('refresh')
            ->setExpiresIn(3600));
        $state = Crypt::encryptString(json_encode(['user' => $user->id, 'expires' => now()->addMinutes(5)->getTimestamp()]));

        $this->get('/api/calendar/google/callback?code=abc&state='.urlencode($state))
            ->assertRedirect(config('app.frontend_url').'/dashboard?view=calendar&calendar=connected');

        $connection = $user->calendarConnection;
        $this->assertSame('sam@gmail.com', $connection->email);
        $this->assertSame('refresh', $connection->refresh_token);
        $this->assertNotSame('refresh', $connection->getRawOriginal('refresh_token'));
    }

    public function test_callback_rejects_a_tampered_or_expired_state(): void
    {
        $user = User::factory()->create();
        $expired = Crypt::encryptString(json_encode(['user' => $user->id, 'expires' => now()->subMinute()->getTimestamp()]));

        foreach (['not-encrypted', $expired] as $state) {
            $this->get('/api/calendar/google/callback?code=abc&state='.urlencode($state))
                ->assertRedirect(config('app.frontend_url').'/dashboard?view=calendar&calendar=error');
        }

        $this->assertNull($user->calendarConnection);
    }

    public function test_events_for_a_day(): void
    {
        Http::fake(['www.googleapis.com/*' => Http::response($this->googleEvents())]);
        $user = User::factory()->subscribed(Plan::Pro)->create(['timezone' => 'Asia/Dhaka']);
        CalendarConnection::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/calendar/events?date=2026-10-01')
            ->assertOk()
            ->assertJsonPath('connected', true)
            ->assertJsonCount(2, 'events')
            ->assertJsonPath('events.0.title', 'Standup')
            ->assertJsonPath('events.1.all_day', true);

        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer access-token')
            && str_contains($request->url(), 'timeMin=2026-10-01T00%3A00%3A00%2B06%3A00'));
    }

    public function test_expired_tokens_are_refreshed(): void
    {
        Http::fake([
            'oauth2.googleapis.com/*' => Http::response(['access_token' => 'new-token', 'expires_in' => 3600]),
            'www.googleapis.com/*' => Http::response(['items' => []]),
        ]);
        $user = User::factory()->subscribed(Plan::Pro)->create();
        $connection = CalendarConnection::factory()->for($user)->expired()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/calendar/events?date=2026-10-01')->assertOk();

        $this->assertSame('new-token', $connection->fresh()->access_token);
        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer new-token'));
    }

    public function test_google_errors_ask_to_reconnect(): void
    {
        Http::fake(['www.googleapis.com/*' => Http::response([], 401)]);
        $user = User::factory()->subscribed(Plan::Pro)->create();
        CalendarConnection::factory()->for($user)->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/calendar/events?date=2026-10-01')
            ->assertStatus(502)
            ->assertJsonPath('connected', true);
    }

    public function test_events_without_a_connection_and_disconnecting(): void
    {
        $user = User::factory()->subscribed(Plan::Pro)->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/calendar/events?date=2026-10-01')
            ->assertOk()
            ->assertJsonPath('connected', false);

        CalendarConnection::factory()->for($user)->create();
        $this->deleteJson('/api/calendar')->assertOk()->assertJsonPath('connected', false);
        $this->assertNull($user->fresh()->calendarConnection);
    }
}
