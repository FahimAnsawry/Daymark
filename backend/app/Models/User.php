<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Plan;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'email_verified_at', 'timezone', 'weekly_recap', 'quiet_hours_start', 'quiet_hours_end', 'morning_digest', 'evening_winddown', 'avatar_url', 'avatar_path'])]
#[Hidden(['remember_token', 'subscription', 'avatar_url', 'avatar_path'])]
#[Appends(['plan', 'avatar', 'avatar_source'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * The most recent (simulated) subscription, which decides the plan.
     */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    /**
     * The plan the user currently has access to. Trials and cancelled subscriptions
     * that haven't ended yet still count.
     */
    public function currentPlan(): Plan
    {
        $subscription = $this->subscription;

        return $subscription?->isValid() ? $subscription->plan : Plan::Free;
    }

    public function hasPlan(Plan $required): bool
    {
        return $this->currentPlan()->includes($required);
    }

    /**
     * Whether a moment falls inside the user's quiet hours (which may run past midnight).
     */
    public function isQuietAt(CarbonInterface $moment): bool
    {
        if (! $this->quiet_hours_start || ! $this->quiet_hours_end) {
            return false;
        }

        $local = $moment->copy()->setTimezone($this->timezone)->format('H:i');
        [$start, $end] = [$this->quiet_hours_start, $this->quiet_hours_end];

        return $start <= $end
            ? $local >= $start && $local < $end
            : $local >= $start || $local < $end;
    }

    /**
     * The next moment quiet hours end after the given one, in UTC.
     */
    public function quietHoursEndAfter(CarbonInterface $moment): CarbonImmutable
    {
        $local = CarbonImmutable::instance($moment)->setTimezone($this->timezone);
        $end = CarbonImmutable::parse($local->toDateString().' '.$this->quiet_hours_end, $this->timezone);

        return ($end->lte($local) ? $end->addDay() : $end)->utc();
    }

    /**
     * The plan as a string, sent to the SPA with the user.
     */
    protected function plan(): Attribute
    {
        return Attribute::get(fn (): string => $this->currentPlan()->value);
    }

    /**
     * The profile image to show: the one from Google when there is one, otherwise an upload.
     */
    protected function avatar(): Attribute
    {
        return Attribute::get(fn (): ?string => filled($this->avatar_url)
            ? $this->avatar_url
            : (filled($this->avatar_path) ? Storage::disk('public')->url($this->avatar_path) : null));
    }

    /**
     * Where the profile image comes from: `google`, `upload`, or null when there is none.
     */
    protected function avatarSource(): Attribute
    {
        return Attribute::get(fn (): ?string => match (true) {
            filled($this->avatar_url) => 'google',
            filled($this->avatar_path) => 'upload',
            default => null,
        });
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function taskCompletions(): HasMany
    {
        return $this->hasMany(TaskCompletion::class);
    }

    public function focusSessions(): HasMany
    {
        return $this->hasMany(FocusSession::class);
    }

    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(PushSubscription::class);
    }

    public function calendarConnection(): HasOne
    {
        return $this->hasOne(CalendarConnection::class);
    }

    /**
     * Projects other people have shared with this user.
     */
    public function sharedProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class)->withTimestamps();
    }

    /**
     * Ids of every project the user can see: their own and the ones shared with them.
     *
     * @return Collection<int, int>
     */
    public function accessibleProjectIds(): Collection
    {
        return $this->projects()->pluck('id')->merge($this->sharedProjects()->pluck('projects.id'));
    }

    /**
     * The user's own tasks plus every task in a project shared with them (or by them).
     *
     * @return Builder<Task>
     */
    public function visibleTasks(): Builder
    {
        $projectIds = $this->accessibleProjectIds();

        return Task::query()->where(fn (Builder $query) => $query
            ->where('user_id', $this->id)
            ->orWhereIn('project_id', $projectIds));
    }

    /**
     * Find a project by name, preferring the user's own, then one shared with them, and
     * create it if neither exists. Blank names mean "no project".
     */
    public function projectIdFor(?string $name): ?int
    {
        $name = trim((string) $name);

        if ($name === '') {
            return null;
        }

        return $this->projects()->where('name', $name)->value('id')
            ?? $this->sharedProjects()->where('name', $name)->value('projects.id')
            ?? $this->projects()->create(['name' => $name])->id;
    }

    public function passwordAccount(): HasOne
    {
        return $this->hasOne(Account::class)->where('provider', Account::PROVIDER_PASSWORD);
    }

    public function linkVerifiedGoogleAccount(string $providerId, ?string $avatarUrl = null): Account
    {
        $account = $this->accounts()->updateOrCreate(
            ['provider' => Account::PROVIDER_GOOGLE],
            ['provider_id' => $providerId, 'password_hash' => null],
        );

        if (filled($avatarUrl)) {
            $this->update(['avatar_url' => $avatarUrl]);
        }

        return $account;
    }

    public function getAuthPassword(): string
    {
        return (string) ($this->passwordAccount?->password_hash ?? '');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'weekly_recap' => 'boolean',
            'morning_digest' => 'boolean',
            'evening_winddown' => 'boolean',
        ];
    }
}
