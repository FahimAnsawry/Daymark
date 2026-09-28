<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarConnection;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;
use Throwable;

/**
 * Read-only Google Calendar sync. Connecting uses its own OAuth flow (separate from sign-in)
 * that asks only for calendar read access; the signed-in user travels in an encrypted `state`.
 */
class CalendarController extends Controller
{
    /** How long a connect link stays valid. */
    private const STATE_TTL_MINUTES = 15;

    /** Events are cached briefly so the Today view can refetch freely. */
    private const CACHE_SECONDS = 300;

    public function show(Request $request): JsonResponse
    {
        $connection = $request->user()->calendarConnection;

        return response()->json([
            'connected' => $connection !== null,
            'email' => $connection?->email,
        ]);
    }

    /**
     * The Google consent URL for the SPA to open.
     */
    public function connect(Request $request): JsonResponse
    {
        $state = Crypt::encryptString(json_encode([
            'user' => $request->user()->id,
            'expires' => now()->addMinutes(self::STATE_TTL_MINUTES)->getTimestamp(),
        ]));

        $url = Socialite::driver('google')
            ->stateless()
            ->redirectUrl(config('services.google.calendar_redirect'))
            ->scopes([CalendarConnection::SCOPE])
            ->with(['access_type' => 'offline', 'prompt' => 'consent', 'state' => $state])
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    /**
     * Google redirects here after consent. Saves the tokens and returns to the SPA.
     */
    public function callback(Request $request): RedirectResponse
    {
        $calendarUrl = config('app.frontend_url').'/dashboard?view=calendar';
        $user = $this->userFromState((string) $request->query('state'));

        if ($user === null || $request->has('error')) {
            return redirect()->away($calendarUrl.'&calendar=error');
        }

        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->redirectUrl(config('services.google.calendar_redirect'))
                ->user();
        } catch (Throwable) {
            return redirect()->away($calendarUrl.'&calendar=error');
        }

        $user->calendarConnection()->updateOrCreate([], [
            'provider' => 'google',
            'email' => $googleUser->getEmail(),
            'access_token' => $googleUser->token,
            // Google only sends a refresh token on first consent; keep the old one otherwise.
            'refresh_token' => $googleUser->refreshToken ?: $user->calendarConnection?->refresh_token,
            'expires_at' => $googleUser->expiresIn ? now()->addSeconds((int) $googleUser->expiresIn) : null,
        ]);

        Cache::forget($this->cacheKey($user, CarbonImmutable::now($user->timezone)));

        return redirect()->away($calendarUrl.'&calendar=connected');
    }

    public function disconnect(Request $request): JsonResponse
    {
        $request->user()->calendarConnection()->delete();

        return response()->json(['connected' => false, 'email' => null]);
    }

    /**
     * One day's events for the Today view.
     */
    public function events(Request $request): JsonResponse
    {
        $user = $request->user();
        $day = CarbonImmutable::parse(
            $request->validate(['date' => ['required', 'date_format:Y-m-d']])['date'],
            $user->timezone,
        );
        $connection = $user->calendarConnection;

        if ($connection === null) {
            return response()->json(['connected' => false, 'events' => []]);
        }

        try {
            $events = Cache::remember(
                $this->cacheKey($user, $day),
                self::CACHE_SECONDS,
                fn () => $connection->eventsOn($day),
            );
        } catch (RequestException|RuntimeException) {
            return response()->json([
                'connected' => true,
                'events' => [],
                'message' => 'We couldn’t reach Google Calendar. You may need to reconnect it.',
            ], 502);
        }

        return response()->json(['connected' => true, 'events' => $events]);
    }

    private function userFromState(string $state): ?User
    {
        try {
            $payload = json_decode(Crypt::decryptString($state), true, flags: JSON_THROW_ON_ERROR);
        } catch (DecryptException|\JsonException) {
            return null;
        }

        if (($payload['expires'] ?? 0) < now()->getTimestamp()) {
            return null;
        }

        return User::find($payload['user'] ?? null);
    }

    private function cacheKey(User $user, CarbonImmutable $day): string
    {
        return "calendar-events:{$user->id}:{$day->toDateString()}";
    }
}
