<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePushSubscriptionRequest;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PushSubscriptionController extends Controller
{
    /**
     * The public VAPID key the browser needs to subscribe. Null when push isn't set up.
     */
    public function key(): JsonResponse
    {
        return response()->json(['public_key' => config('services.webpush.public_key')]);
    }

    /**
     * Remember this browser for reminder notifications. A browser that was
     * subscribed under another account moves to this one.
     */
    public function store(StorePushSubscriptionRequest $request): Response
    {
        PushSubscription::updateOrCreate(
            ['endpoint' => $request->validated('endpoint')],
            [
                'user_id' => $request->user()->id,
                'public_key' => $request->validated('keys.p256dh'),
                'auth_token' => $request->validated('keys.auth'),
                'content_encoding' => $request->validated('content_encoding') ?? 'aes128gcm',
            ],
        );

        return response()->noContent();
    }

    public function destroy(Request $request): Response
    {
        $request->validate(['endpoint' => ['required', 'string']]);

        $request->user()->pushSubscriptions()->where('endpoint', $request->input('endpoint'))->delete();

        return response()->noContent();
    }
}
