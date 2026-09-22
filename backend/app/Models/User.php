<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'email_verified_at'])]
#[Hidden(['remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    public function passwordAccount(): HasOne
    {
        return $this->hasOne(Account::class)->where('provider', Account::PROVIDER_PASSWORD);
    }

    public function linkVerifiedGoogleAccount(string $providerId): Account
    {
        return $this->accounts()->updateOrCreate(
            ['provider' => Account::PROVIDER_GOOGLE],
            ['provider_id' => $providerId, 'password_hash' => null],
        );
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
        ];
    }
}
