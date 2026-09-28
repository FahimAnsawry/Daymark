<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\User;
use App\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    public function test_billing_requires_authentication(): void
    {
        $this->getJson('/api/billing')->assertUnauthorized();
        $this->postJson('/api/billing/checkout')->assertUnauthorized();
        $this->postJson('/api/billing/cancel')->assertUnauthorized();
    }

    public function test_new_users_are_on_the_free_plan(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/billing')
            ->assertOk()
            ->assertJsonPath('plan', 'free')
            ->assertJsonPath('status', null);
    }

    public function test_first_checkout_starts_a_trial_of_the_chosen_plan(): void
    {
        $this->freezeTime();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/billing/checkout', [
            'plan' => 'pro',
            'period' => 'yearly',
            'card_brand' => 'visa',
            'card_last4' => '4242',
        ])
            ->assertCreated()
            ->assertJsonPath('plan', 'pro')
            ->assertJsonPath('status', 'trialing')
            ->assertJsonPath('period', 'yearly')
            ->assertJsonPath('on_trial', true)
            ->assertJsonPath('trial_ends_at', now()->addDays(Plan::TRIAL_DAYS)->toIso8601String())
            ->assertJsonPath('card_last4', '4242');

        $this->getJson('/api/auth/me')->assertJsonPath('user.plan', 'pro');
    }

    public function test_returning_subscribers_do_not_get_a_second_trial(): void
    {
        $user = User::factory()->create();
        Subscription::factory()->for($user)->ended()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/billing/checkout', ['plan' => 'plus', 'period' => 'monthly'])
            ->assertCreated()
            ->assertJsonPath('plan', 'plus')
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('on_trial', false);
    }

    public function test_checkout_parameters_are_validated(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/billing/checkout', [
            'plan' => 'gold',
            'period' => 'weekly',
            'card_brand' => 'discover',
            'card_last4' => '42',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['plan', 'period', 'card_brand', 'card_last4']);
    }

    public function test_subscribed_users_cannot_check_out_again(): void
    {
        Sanctum::actingAs(User::factory()->subscribed(Plan::Plus)->create());

        $this->postJson('/api/billing/checkout', ['plan' => 'pro', 'period' => 'monthly'])
            ->assertConflict();
    }

    public function test_paid_users_can_switch_plans_and_keep_their_trial(): void
    {
        $user = User::factory()->create();
        $trial = Subscription::factory()->for($user)->trialing()->create(['plan' => Plan::Plus, 'period' => 'yearly']);
        Sanctum::actingAs($user);

        $this->postJson('/api/billing/change', ['plan' => 'pro'])
            ->assertOk()
            ->assertJsonPath('plan', 'pro')
            ->assertJsonPath('period', 'yearly')
            ->assertJsonPath('status', 'trialing')
            ->assertJsonPath('trial_ends_at', $trial->trial_ends_at->toIso8601String());

        $this->postJson('/api/billing/change', ['plan' => 'pro'])->assertConflict();
    }

    public function test_free_users_cannot_switch_plans(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/billing/change', ['plan' => 'pro'])->assertConflict();
    }

    public function test_cancelling_a_trial_keeps_access_until_it_ends(): void
    {
        $user = User::factory()->create();
        $subscription = Subscription::factory()->for($user)->trialing()->create(['plan' => Plan::Pro]);
        Sanctum::actingAs($user);

        $this->postJson('/api/billing/cancel')
            ->assertOk()
            ->assertJsonPath('plan', 'pro')
            ->assertJsonPath('status', 'canceled')
            ->assertJsonPath('on_trial', false);

        $this->travelTo($subscription->trial_ends_at->addMinute());
        $this->getJson('/api/billing')
            ->assertJsonPath('plan', 'free')
            ->assertJsonPath('status', 'ended');
    }

    public function test_cancelling_a_paid_plan_ends_it_now(): void
    {
        Sanctum::actingAs(User::factory()->subscribed(Plan::Plus)->create());

        $this->postJson('/api/billing/cancel')->assertOk();

        $this->travel(1)->seconds();
        $this->getJson('/api/billing')->assertJsonPath('plan', 'free');
    }

    public function test_there_is_nothing_to_cancel_on_the_free_plan(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/billing/cancel')->assertConflict();
    }

    public function test_current_user_payload_includes_the_plan_but_not_the_subscription(): void
    {
        Sanctum::actingAs(User::factory()->subscribed(Plan::Pro)->create());

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.plan', 'pro')
            ->assertJsonMissingPath('user.subscription');
    }

    public function test_plan_middleware_returns_402_below_the_required_plan(): void
    {
        Route::middleware(['api', 'auth:sanctum', 'plan:pro'])->get('/api/test-pro-only', fn () => ['ok' => true]);

        Sanctum::actingAs(User::factory()->subscribed(Plan::Plus)->create());
        $this->getJson('/api/test-pro-only')
            ->assertPaymentRequired()
            ->assertJsonPath('required_plan', 'pro')
            ->assertJsonPath('upgrade', true);

        Sanctum::actingAs(User::factory()->subscribed(Plan::Pro)->create());
        $this->getJson('/api/test-pro-only')->assertOk();
    }

    public function test_preferences_can_be_updated(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/auth/preferences', ['timezone' => 'Asia/Dhaka', 'weekly_recap' => false])
            ->assertOk()
            ->assertJsonPath('user.timezone', 'Asia/Dhaka')
            ->assertJsonPath('user.weekly_recap', false);

        $this->putJson('/api/auth/preferences', ['timezone' => 'Mars/Olympus'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['timezone']);
    }

    public function test_cancel_trial_requires_authentication(): void
    {
        $this->postJson('/api/billing/cancel-trial')->assertUnauthorized();
    }

    public function test_cancel_trial_immediately_reverts_user_to_free_plan(): void
    {
        $user = User::factory()->create();
        Subscription::factory()->for($user)->trialing()->create(['plan' => Plan::Pro]);
        Sanctum::actingAs($user);

        $this->postJson('/api/billing/cancel-trial')
            ->assertOk()
            ->assertJsonPath('plan', 'free')
            ->assertJsonPath('status', null)
            ->assertJsonPath('on_trial', false);

        $this->getJson('/api/billing')
            ->assertOk()
            ->assertJsonPath('plan', 'free')
            ->assertJsonPath('status', null);
    }

    public function test_cancel_trial_fails_if_no_subscription(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/billing/cancel-trial')->assertConflict();
    }
}
