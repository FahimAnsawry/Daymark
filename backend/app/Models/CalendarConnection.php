<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\CalendarConnectionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * A read-only link to someone's Google Calendar. Tokens are encrypted at rest.
 */
#[Fillable(['user_id', 'provider', 'email', 'access_token', 'refresh_token', 'expires_at'])]
#[Hidden(['access_token', 'refresh_token'])]
class CalendarConnection extends Model
{
    /** @use HasFactory<CalendarConnectionFactory> */
    use HasFactory;

    public const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Events on one local day, earliest first. All-day events come back with `all_day` set.
     *
     * @return array<int, array{id: string, title: string, start: string, end: string, all_day: bool}>
     */
    public function eventsOn(CarbonImmutable $day): array
    {
        $timezone = $this->user->timezone;
        $start = CarbonImmutable::parse($day->toDateString(), $timezone)->startOfDay();

        $response = Http::withToken($this->freshAccessToken())
            ->get('https://www.googleapis.com/calendar/v3/calendars/primary/events', [
                'timeMin' => $start->toRfc3339String(),
                'timeMax' => $start->addDay()->toRfc3339String(),
                'timeZone' => $timezone,
                'singleEvents' => 'true',
                'orderBy' => 'startTime',
                'maxResults' => 50,
            ])
            ->throw();

        return collect($response->json('items', []))
            ->reject(fn (array $item): bool => ($item['status'] ?? '') === 'cancelled')
            ->map(fn (array $item): array => [
                'id' => (string) $item['id'],
                'title' => $item['summary'] ?? 'Busy',
                'start' => $item['start']['dateTime'] ?? $item['start']['date'],
                'end' => $item['end']['dateTime'] ?? $item['end']['date'],
                'all_day' => ! isset($item['start']['dateTime']),
            ])
            ->values()
            ->all();
    }

    /**
     * The access token, refreshed with the refresh token when it has (nearly) expired.
     */
    public function freshAccessToken(): string
    {
        if ($this->expires_at === null || $this->expires_at->isAfter(now()->addMinute())) {
            return $this->access_token;
        }

        if (! $this->refresh_token) {
            throw new RuntimeException('The calendar connection has expired.');
        }

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $this->refresh_token,
            'grant_type' => 'refresh_token',
        ])->throw();

        $this->update([
            'access_token' => $response->json('access_token'),
            'expires_at' => now()->addSeconds((int) $response->json('expires_in', 3600)),
        ]);

        return $this->access_token;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'expires_at' => 'datetime',
        ];
    }
}
