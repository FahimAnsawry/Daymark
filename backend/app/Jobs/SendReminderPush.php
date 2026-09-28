<?php

namespace App\Jobs;

use App\Models\PushSubscription;
use App\Models\Task;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Minishlink\WebPush\WebPush;

/**
 * Shows a reminder as a notification in every browser the owner subscribed,
 * even when Daymark isn't open. Browsers that unsubscribed are forgotten.
 */
class SendReminderPush implements ShouldQueue
{
    use Queueable;

    public function __construct(public Task $task) {}

    public static function isConfigured(): bool
    {
        return filled(config('services.webpush.public_key')) && filled(config('services.webpush.private_key'));
    }

    public function handle(): void
    {
        $subscriptions = $this->task->user->pushSubscriptions;

        if ($subscriptions->isEmpty() || ! self::isConfigured()) {
            return;
        }

        $webPush = app(WebPush::class);
        $payload = json_encode($this->payload());

        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification($subscription->toWebPush(), $payload);
        }

        foreach ($webPush->flush() as $report) {
            if ($report->isSubscriptionExpired()) {
                PushSubscription::where('endpoint', $report->getEndpoint())->delete();
            }
        }
    }

    /**
     * What the service worker shows. The tag matches the open tab's notification,
     * so the same reminder never appears twice.
     *
     * @return array{title: string, body: string, tag: string, url: string}
     */
    public function payload(): array
    {
        $this->task->loadMissing('project');

        return [
            'title' => $this->task->title,
            'body' => collect([$this->task->due_time, $this->task->project?->name])->filter()->implode(' · ') ?: 'A gentle reminder',
            'tag' => "daymark-task-{$this->task->id}",
            'url' => '/dashboard?view=today',
        ];
    }
}
