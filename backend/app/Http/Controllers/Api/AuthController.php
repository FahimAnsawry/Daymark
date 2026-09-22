<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
            if ($request->isMethod('post') && $request->filled('token')) {
                $socialUser = Socialite::driver($provider)->stateless()->userFromToken($request->input('token'));
            } else {
                $socialUser = Socialite::driver($provider)->stateless()->user();
            }
        } catch (\Throwable $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unable to authenticate with ' . ucfirst($provider) . ': ' . $e->getMessage(),
                ], 422);
            }

            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
            return redirect()->to($frontendUrl . '/login?error=' . urlencode('Social authentication failed'));
        }

        $email = $socialUser->getEmail();
        if (! $email) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'No email address provided by ' . ucfirst($provider),
                ], 422);
            }

            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
            return redirect()->to($frontendUrl . '/login?error=' . urlencode('No email provided by social provider'));
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
                $user->linkVerifiedGoogleAccount((string) $socialUser->getId());
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
        return redirect()->to($frontendUrl . '/login?token=' . urlencode($token));
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
     * Validate if the provider is supported.
     */
    protected function ensureProviderIsSupported(string $provider): void
    {
        if (! in_array($provider, $this->supportedProviders, true)) {
            abort(404, "Authentication provider [{$provider}] is not supported.");
        }
    }
}
