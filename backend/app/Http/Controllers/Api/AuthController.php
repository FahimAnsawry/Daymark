<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Supported OAuth providers.
     *
     * @var list<string>
     */
    protected array $supportedProviders = ['google', 'github'];

    /**
     * Handle user registration.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        $user = DB::transaction(function () use ($validated): User {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);

            $user->accounts()->create([
                'provider' => Account::PROVIDER_PASSWORD,
                'password_hash' => Hash::make($validated['password']),
            ]);

            return $user;
        });

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user->load('accounts'),
            'token' => $token,
        ], 201);
    }

    /**
     * Handle user login.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $credentials['email'])->with('passwordAccount')->first();

        if (! $user || ! Hash::check($credentials['password'], $user->getAuthPassword())) {
            return response()->json([
                'message' => 'Invalid email or password',
            ], 422);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->load('accounts'),
            'token' => $token,
        ]);
    }

    /**
     * Redirect to the specified OAuth provider.
     */
    public function redirectToProvider(Request $request, string $provider): Response
    {
        $this->ensureProviderIsSupported($provider);

        $clientId = config("services.{$provider}.client_id");
        if (empty($clientId)) {
            $errorMessage = 'Google Client ID is not configured in backend/.env. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.';
            if ($request->expectsJson() || $request->query('json')) {
                return response()->json([
                    'message' => $errorMessage,
                ], 422);
            }

            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

            return redirect()->to($frontendUrl.'/login?error='.urlencode($errorMessage));
        }

        $targetUrl = Socialite::driver($provider)->stateless()->redirect()->getTargetUrl();

        if ($request->expectsJson() || $request->query('json')) {
            return response()->json(['url' => $targetUrl]);
        }

        return redirect()->away($targetUrl);
    }

    /**
     * Handle the OAuth provider callback and authenticate the user.
     */
    public function handleProviderCallback(Request $request, string $provider): Response
    {
        $this->ensureProviderIsSupported($provider);

        try {
            // Support for Google Identity Services / One Tap (id_token / credential)
            if ($provider === 'google' && $request->isMethod('post') && ($request->filled('credential') || $request->filled('id_token'))) {
                $idToken = $request->input('credential') ?? $request->input('id_token');
                $tokenInfoResponse = Http::withOptions([
                    'verify' => file_exists(storage_path('cacert.pem')) ? storage_path('cacert.pem') : true,
                ])->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $idToken]);

                if (! $tokenInfoResponse->successful()) {
                    throw new \Exception('Invalid Google ID token: '.($tokenInfoResponse->json('error_description') ?? 'Verification failed'));
                }

                $googleData = $tokenInfoResponse->json();
                $email = $googleData['email'] ?? null;
                $name = $googleData['name'] ?? $googleData['given_name'] ?? 'Google User';
                $googleId = (string) ($googleData['sub'] ?? '');
                $picture = $googleData['picture'] ?? null;

                if (! $email) {
                    throw new \Exception('No email address provided by Google credential');
                }

                $user = DB::transaction(function () use ($googleId, $email, $name, $picture): User {
                    $user = User::where('email', $email)->first();
 
                    if (! $user) {
                        $user = User::create([
                            'name' => $name,
                            'email' => $email,
                            'email_verified_at' => now(),
                        ]);
                    }

                    $user->linkVerifiedGoogleAccount($googleId, $picture);

                    return $user;
                });

                $token = $user->createToken('auth-token')->plainTextToken;

                return response()->json([
                    'message' => 'Login successful',
                    'user' => $user->load('accounts'),
                    'token' => $token,
                ]);
            }

            if ($request->isMethod('post') && $request->filled('token')) {
                $socialUser = Socialite::driver($provider)->stateless()->userFromToken($request->input('token'));
            } else {
                $socialUser = Socialite::driver($provider)->stateless()->user();
            }
        } catch (\Throwable $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unable to authenticate with '.ucfirst($provider).': '.$e->getMessage(),
                ], 422);
            }

            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

            return redirect()->to($frontendUrl.'/login?error='.urlencode('Social authentication failed: '.$e->getMessage()));
        }

        $email = $socialUser->getEmail();
        if (! $email) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'No email address provided by '.ucfirst($provider),
                ], 422);
            }

            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

            return redirect()->to($frontendUrl.'/login?error='.urlencode('No email provided by social provider'));
        }

        $user = DB::transaction(function () use ($socialUser, $provider, $email): User {
            $user = User::where('email', $email)->first();

            if (! $user) {
                $user = User::create([
                    'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
                    'email' => $email,
                    'email_verified_at' => now(),
                ]);
            }

            if ($provider === Account::PROVIDER_GOOGLE) {
                $user->linkVerifiedGoogleAccount((string) $socialUser->getId(), $socialUser->getAvatar());
            } else {
                $user->accounts()->updateOrCreate(
                    ['provider' => $provider],
                    ['provider_id' => (string) $socialUser->getId(), 'password_hash' => null],
                );
            }

            return $user;
        });

        $token = $user->createToken('auth-token')->plainTextToken;

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Login successful',
                'user' => $user->load('accounts'),
                'token' => $token,
            ]);
        }

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

        return redirect()->to($frontendUrl.'/login?token='.urlencode($token));
    }

    /**
     * Local development demo login for Google authentication.
     */
    public function loginWithDemoGoogle(Request $request): JsonResponse
    {
        if (! app()->environment('local')) {
            abort(403, 'Demo login is only available in local development mode.');
        }

        $user = DB::transaction(function (): User {
            $user = User::firstOrCreate(
                ['email' => 'alex.rivera@daymark.test'],
                [
                    'name' => 'Alex Rivera',
                    'email_verified_at' => now(),
                ],
            );

            $user->linkVerifiedGoogleAccount('google_demo_id_108293849102');

            return $user;
        });

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Successfully signed in with Google (Dev Demo)',
            'user' => $user->load('accounts'),
            'token' => $token,
        ]);
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('accounts'),
        ]);
    }

    /**
     * Update authenticated user profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh()->load('accounts'),
        ]);
    }

    /**
     * Update planning preferences: the user's timezone and the weekly recap email.
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->update($request->validate([
            'timezone' => ['sometimes', 'string', 'timezone:all'],
            'weekly_recap' => ['sometimes', 'boolean'],
            'quiet_hours_start' => ['nullable', 'date_format:H:i', 'required_with:quiet_hours_end'],
            'quiet_hours_end' => ['nullable', 'date_format:H:i', 'required_with:quiet_hours_start'],
            'morning_digest' => ['sometimes', 'boolean'],
            'evening_winddown' => ['sometimes', 'boolean'],
        ]));

        // Reminder times are stored in UTC, so they move with the user's timezone.
        if ($user->wasChanged('timezone')) {
            $user->tasks()->whereNotNull('reminder')->whereNull('reminded_at')->get()
                ->each(function ($task): void {
                    $task->scheduleReminder();
                    $task->save();
                });
        }

        return response()->json([
            'user' => $user->fresh()->load('accounts'),
        ]);
    }

    /**
     * Update authenticated user password. Someone who signed in with Google has no password
     * yet, so they can set one without a current password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        $passwordAccount = $user->passwordAccount;

        $validated = $request->validate([
            'current_password' => [Rule::requiredIf($passwordAccount !== null), 'nullable', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        if ($passwordAccount && ! Hash::check($validated['current_password'], $passwordAccount->password_hash)) {
            return response()->json([
                'message' => 'The provided current password does not match our records.',
                'errors' => [
                    'current_password' => ['The provided current password does not match our records.'],
                ],
            ], 422);
        }

        if ($passwordAccount) {
            $passwordAccount->update([
                'password_hash' => Hash::make($validated['password']),
            ]);
        } else {
            $user->accounts()->create([
                'provider' => Account::PROVIDER_PASSWORD,
                'password_hash' => Hash::make($validated['password']),
            ]);
        }

        return response()->json([
            'message' => 'Password updated successfully',
            'user' => $user->fresh()->load('accounts'),
        ]);
    }

    /**
     * Upload a profile image. It is only for people whose Google account has no image.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if (filled($user->avatar_url)) {
            return response()->json([
                'message' => 'Your profile image comes from your Google account.',
            ], 422);
        }

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $previousPath = $user->avatar_path;
        $user->update(['avatar_path' => $request->file('avatar')->store('avatars', 'public')]);

        if ($previousPath) {
            Storage::disk('public')->delete($previousPath);
        }

        return response()->json([
            'message' => 'Profile image updated successfully',
            'user' => $user->fresh()->load('accounts'),
        ]);
    }

    /**
     * Remove the uploaded profile image.
     */
    public function destroyAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->update(['avatar_path' => null]);
        }

        return response()->json([
            'user' => $user->fresh()->load('accounts'),
        ]);
    }

    /**
     * Validate if the provider is supported.
     */
    protected function ensureProviderIsSupported(string $provider): void
    {
        if (! in_array($provider, $this->supportedProviders, true)) {
            abort(404, "Authentication provider [{$provider}] is not supported.");
        }
    }
}
