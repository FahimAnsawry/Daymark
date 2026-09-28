<?php

namespace App\Models;

use Database\Factories\PushSubscriptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Minishlink\WebPush\Subscription;

/**
 * One browser that agreed to receive reminder notifications (Web Push).
 */
#[Fillable(['user_id', 'endpoint', 'public_key', 'auth_token', 'content_encoding'])]
#[Hidden(['public_key', 'auth_token'])]
class PushSubscription extends Model
{
    /** @use HasFactory<PushSubscriptionFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toWebPush(): Subscription
    {
        return Subscription::create([
            'endpoint' => $this->endpoint,
            'publicKey' => $this->public_key,
            'authToken' => $this->auth_token,
            'contentEncoding' => $this->content_encoding,
        ]);
    }
}
