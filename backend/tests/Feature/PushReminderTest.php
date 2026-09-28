<?php

namespace Tests\Feature;

use App\Jobs\SendReminderPush;
use App\Models\PushSubscription;
use App\Models\Task;
use App\Models\User;
use App\Plan;
use Carbon\CarbonImmutable;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Minishlink\WebPush\MessageSentReport;
use Minishlink\WebPush\WebPush;
use Mockery;
use Tests\TestCase;

class PushReminderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.webpush.public_key' => 'test-public-key', 'services.webpush.private_key' => 'test-private-key']);
    }

    /**
     * @return array{endpoint: string, keys: array{p256dh: string, auth: string}}
     */
    private function browserSubscription(string $endpoint = 'https://push.example.test/abc'): array
    {
        return ['endpoint' => $endpoint, 'keys' => ['p256dh' => 'client-public-key', 'auth' => 'client-auth']];
    }

    public function test_the_public_key_is_shared_with_the_browser(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/push/key')->assertOk()->assertJsonPath('public_key', 'test-public-key');
    }

    public function test_subscribing_a_browser_needs_plus(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/push/subscriptions', $this->browserSubscription())->assertPaymentRequired();
        $this->assertDatabaseCount('push_subscriptions', 0);
    }

    public function test_a_browser_subscribes_once_and_moves_between_accounts(): void
    {
        $first = User::factory()->subscribed(Plan::Plus)->create();
        $second = User::factory()->subscribed(Plan::Plus)->create();

        Sanctum::actingAs($first);
        $this->postJson('/api/push/subscriptions', $this->browserSubscription())->assertNoContent();
        $this->postJson('/api/push/subscriptions', $this->browserSubscription())->assertNoContent();

        Sanctum::actingAs($second);
        $this->postJson('/api/push/subscriptions', $this->browserSubscription())->assertNoContent();

        $this->assertDatabaseCount('push_subscriptions', 1);
        $this->assertDatabaseHas('push_subscriptions', ['user_id' => $second->id, 'public_key' => 'client-public-key']);
    }

    public function test_subscriptions_are_validated(): void
    {
        Sanctum::actingAs(User::factory()->subscribed(Plan::Plus)->create());

        $this->postJson('/api/push/subscriptions', ['endpoint' => 'http://insecure.test/x'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['endpoint', 'keys.p256dh', 'keys.auth']);
    }

    public function test_unsubscribing_only_removes_your_own_browser(): void
    {
        $user = User::factory()->create();
        $mine = PushSubscription::factory()->for($user)->create();
        $theirs = PushSubscription::factory()->create();
        Sanctum::actingAs($user);

        $this->deleteJson('/api/push/subscriptions', ['endpoint' => $mine->endpoint])->assertNoContent();
        $this->deleteJson('/api/push/subscriptions', ['endpoint' => $theirs->endpoint])->assertNoContent();

        $this->assertModelMissing($mine);
        $this->assertModelExists($theirs);
    }

    public function test_due_reminders_are_pushed_to_subscribed_browsers(): void
    {
        Mail::fake();
        Queue::fake([SendReminderPush::class]);
        $user = User::factory()->subscribed(Plan::Plus)->has(PushSubscription::factory())->create();
        $task = Task::factory()->for($user)->create(['title' => 'Call mom', 'due_date' => '2026-10-01', 'reminder' => '17:00']);
        $withoutBrowser = Task::factory()->for(User::factory()->subscribed(Plan::Plus))->create(['due_date' => '2026-10-01', 'reminder' => '17:00']);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 17:00:10'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        Queue::assertPushed(SendReminderPush::class, 1);
        Queue::assertPushed(SendReminderPush::class, fn (SendReminderPush $job) => $job->task->is($task));
        $this->assertNotNull($withoutBrowser->fresh()->reminded_at);
    }

    public function test_nothing_is_pushed_when_push_is_not_configured(): void
    {
        Mail::fake();
        Queue::fake([SendReminderPush::class]);
        config(['services.webpush.private_key' => null]);
        $user = User::factory()->subscribed(Plan::Plus)->has(PushSubscription::factory())->create();
        Task::factory()->for($user)->create(['due_date' => '2026-10-01', 'reminder' => '17:00']);

        $this->travelTo(CarbonImmutable::parse('2026-10-01 17:00:10'));
        $this->artisan('daymark:send-reminders')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_the_push_reaches_every_browser_and_forgets_expired_ones(): void
    {
        $user = User::factory()->subscribed(Plan::Plus)->create();
        $active = PushSubscription::factory()->for($user)->create();
        $expired = PushSubscription::factory()->for($user)->create();
        $task = Task::factory()->for($user)->create(['title' => 'Call mom', 'due_date' => '2026-10-01', 'due_time' => '17:00', 'reminder' => '17:00']);

        $webPush = Mockery::mock(WebPush::class);
        $webPush->shouldReceive('queueNotification')->twice()->withArgs(function ($subscription, string $payload) use ($task): bool {
            $message = json_decode($payload, true);

            return $message['title'] === 'Call mom' && $message['body'] === '17:00' && $message['tag'] === "daymark-task-{$task->id}";
        });
        $webPush->shouldReceive('flush')->once()->andReturnUsing(function () use ($active, $expired) {
            yield new MessageSentReport(new Request('POST', $active->endpoint), new Response(201));
            yield new MessageSentReport(new Request('POST', $expired->endpoint), new Response(410), false, 'Gone');
        });
        $this->app->instance(WebPush::class, $webPush);

        (new SendReminderPush($task))->handle();

        $this->assertModelExists($active);
        $this->assertModelMissing($expired);
    }
}
