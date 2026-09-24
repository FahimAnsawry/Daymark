import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Eye, EyeOff, LogIn } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { BrandMark } from './BrandMark'
import { GoogleIcon } from './GoogleIcon'
import { LegalModal, type LegalModalType } from './LegalModal'
import { ThemeToggle } from './ThemeToggle'
import toast from 'react-hot-toast'

type AuthMode = 'login' | 'register'

interface AuthPageProps {
  mode: AuthMode
}

interface AuthFormValues {
  name: string
  email: string
  password: string
  passwordConfirmation: string
}

const authFormSchema = z.object({
  name: z.string(),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address.')
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Please enter your password.')
    .min(8, 'Password must be at least 8 characters.'),
  passwordConfirmation: z.string(),
})

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const { login, register: authRegister, isAuthenticated, isLoading } = useAuth()
  const isLogin = mode === 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('error') || ''
    }
    return ''
  })
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(
      authFormSchema.superRefine((values, context) => {
        if (!isLogin && !values.name.trim()) {
          context.addIssue({ code: 'custom', path: ['name'], message: 'Please enter your name.' })
        }
        if (!isLogin && !values.passwordConfirmation) {
          context.addIssue({
            code: 'custom',
            path: ['passwordConfirmation'],
            message: 'Please confirm your password.',
          })
        } else if (!isLogin && values.passwordConfirmation !== values.password) {
          context.addIssue({
            code: 'custom',
            path: ['passwordConfirmation'],
            message: 'Passwords do not match.',
          })
        }
      }),
    ),
    defaultValues: { name: '', email: '', password: '', passwordConfirmation: '' },
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate({ to: '/dashboard', replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  // Handle OAuth callback token in query params
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const oauthError = params.get('error')

    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname)
      login(token).then(() => {
        navigate({ to: '/dashboard', replace: true })
      })
    } else if (oauthError) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [login, navigate])

  const onSubmit: SubmitHandler<AuthFormValues> = async (values) => {
    setError('')

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', {
          email: values.email,
          password: values.password,
        })
        await login(response.data.token, response.data.user)
      } else {
        const response = await api.post('/auth/register', {
          name: values.name,
          email: values.email,
          password: values.password,
          password_confirmation: values.passwordConfirmation,
        })
        await authRegister(response.data.token, response.data.user)
      }
      toast.success(isLogin ? 'Signed in successfully.' : 'Account created successfully.')
      navigate({ to: '/dashboard', replace: true })
    } catch (requestError: any) {
      const validationMessage = requestError.response?.data?.errors
        ? Object.values(requestError.response.data.errors).flat()[0]
        : requestError.response?.data?.message
      const message = String(validationMessage || 'Something went wrong. Please try again.')
      setError(message)
      toast.error(message)
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    setIsGoogleLoading(true)

    try {
      const response = await api.get('/auth/google/redirect', {
        headers: { Accept: 'application/json' },
      })
      if (response.data?.url) {
        window.location.href = response.data.url
      } else {
        window.location.href = '/auth/google'
      }
    } catch (err: any) {
      setIsGoogleLoading(false)
      const message =
        err.response?.data?.message ||
        'Unable to initialize Google Sign-In. Please check your backend Google OAuth credentials.'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <main className="flex flex-col justify-start items-center lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(400px,0.88fr)] min-h-screen min-h-dvh text-[#172320] dark:text-[#f3f4f6] bg-app-background p-[18px_18px_28px] lg:p-0 transition-colors duration-250">
      <div
        className="hidden lg:grid relative self-center h-[calc(100dvh-80px)] max-h-[640px] min-h-[440px] overflow-hidden place-items-center isolate m-7 border border-[#2c4736]/20 rounded-[28px] bg-[#183b37] before:absolute before:inset-0 before:rounded-[inherit] before:-z-20 before:bg-[url('https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1800&q=85')] before:bg-cover before:bg-center before:scale-[1.015] after:absolute after:inset-0 after:rounded-[inherit] after:-z-10 after:bg-[linear-gradient(102deg,rgba(14,49,45,0.9)_0%,rgba(14,49,45,0.62)_36%,rgba(11,36,36,0.08)_74%),linear-gradient(180deg,rgba(8,27,28,0.38),transparent_45%,rgba(8,27,28,0.45)),linear-gradient(transparent_55%,rgba(11,36,36,0.74))]"
        aria-hidden="true"
      />

      <section
        className="flex flex-col justify-center w-full max-w-[400px] lg:w-[min(420px,84%)] min-h-auto lg:min-h-dvh py-2 lg:py-5.5 mx-auto"
        aria-labelledby="auth-title"
      >
        <div className="flex items-center justify-between w-full mb-4.5 lg:mb-6">
          <Link
            className="inline-flex items-center gap-1.5 text-[#667085] dark:text-[#a7b0bf] hover:text-[#ea580c] dark:hover:text-[#fb923c] text-[0.75rem] transition-colors"
            to="/"
          >
            <ArrowLeft size={15} /> Back to Daymark
          </Link>
          <ThemeToggle variant="light" />
        </div>

        <div className="group inline-flex items-center gap-[9px] mb-4.5 lg:mb-6.5 text-[#28382f] dark:text-[#f3f4f6] text-[0.84rem] font-bold tracking-[0.12em]">
          <BrandMark />
          <span>DAYMARK</span>
        </div>

        <div className="mb-4 lg:mb-4.5">
          {isLogin && (
            <p className="mb-1 lg:mb-2.5 text-[#ea580c] dark:text-[#fb923c] text-[0.72rem] font-bold tracking-[0.08em] uppercase">
              Welcome back
            </p>
          )}
          <h1
            id="auth-title"
            className="mb-2.5 text-[#1c2a24] dark:text-[#f2f4ee] font-display text-[clamp(1.85rem,6vw,2.9rem)] font-semibold tracking-[-0.04em] leading-[0.98]"
          >
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h1>
        </div>

        <button
          className="flex w-full items-center justify-center gap-2.5 h-[45px] border border-[#d4dbd2] dark:border-[#383838] rounded-[2px] bg-app-background text-[#28382f] dark:text-[#f3f4f6] text-[0.8rem] font-bold cursor-pointer transition-all duration-200 hover:border-[#8b9b8d] dark:hover:border-[#4d4d4d] hover:-translate-y-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] disabled:opacity-60 disabled:cursor-wait"
          type="button"
          onClick={handleGoogleAuth}
          disabled={isGoogleLoading}
        >
          <GoogleIcon size={18} />
          <span>
            {isGoogleLoading
              ? 'Connecting to Google…'
              : isLogin
                ? 'Continue with Google'
                : 'Sign up with Google'}
          </span>
        </button>

        <div className="flex items-center gap-3.5 my-3.5 text-[#9ba59e] dark:text-[#79877d] text-[0.67rem] before:h-px before:flex-1 before:bg-[#dfe4dd] dark:before:bg-[#333333] after:h-px after:flex-1 after:bg-[#dfe4dd] dark:after:bg-[#333333]">
          <span>or use your email</span>
        </div>

        <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)} noValidate>
          {!isLogin && (
            <label className="grid gap-1.5 text-[#435249] dark:text-[#c5cec7] text-[0.71rem] font-bold">
              Full name
              <input
                {...register('name')}
                autoComplete="name"
                aria-invalid={errors.name ? 'true' : 'false'}
                className="w-full h-[42px] border border-[#d9dee7] dark:border-[#383838] rounded-[2px] px-3 text-[#203028] dark:text-[#f3f4f6] bg-white/75 dark:bg-app-background text-[0.84rem] font-normal outline-none transition-all duration-200 focus:border-[#64748b] dark:focus:border-[#94a3b8] focus:ring-2 focus:ring-[#64748b]/20 dark:focus:ring-[#94a3b8]/20 aria-[invalid=true]:border-[#ea580c] dark:aria-[invalid=true]:border-[#fb923c]"
              />
              {errors.name && (
                <span
                  className="text-[#c2410c] dark:text-[#fb923c] text-[0.68rem] font-semibold leading-tight"
                  role="alert"
                >
                  {errors.name.message}
                </span>
              )}
            </label>
          )}

          <label className="grid gap-1.5 text-[#435249] dark:text-[#c5cec7] text-[0.71rem] font-bold">
            Email address
            <input
              type="email"
              {...register('email')}
              autoComplete="email"
              aria-invalid={errors.email ? 'true' : 'false'}
              className="w-full h-[42px] border border-[#d9dee7] dark:border-[#383838] rounded-[2px] px-3 text-[#203028] dark:text-[#f3f4f6] bg-white/75 dark:bg-app-background text-[0.84rem] font-normal outline-none transition-all duration-200 focus:border-[#64748b] dark:focus:border-[#94a3b8] focus:ring-2 focus:ring-[#64748b]/20 dark:focus:ring-[#94a3b8]/20 aria-[invalid=true]:border-[#ea580c] dark:aria-[invalid=true]:border-[#fb923c]"
            />
            {errors.email && (
              <span
                className="text-[#c2410c] dark:text-[#fb923c] text-[0.68rem] font-semibold leading-tight"
                role="alert"
              >
                {errors.email.message}
              </span>
            )}
          </label>

          <label className="grid gap-1.5 text-[#435249] dark:text-[#c5cec7] text-[0.71rem] font-bold">
            Password
            <span className="relative block">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                aria-invalid={errors.password ? 'true' : 'false'}
                className="w-full h-[42px] border border-[#d9dee7] dark:border-[#383838] rounded-[2px] px-3 pr-10 text-[#203028] dark:text-[#f3f4f6] bg-white/75 dark:bg-app-background text-[0.84rem] font-normal outline-none transition-all duration-200 focus:border-[#64748b] dark:focus:border-[#94a3b8] focus:ring-2 focus:ring-[#64748b]/20 dark:focus:ring-[#94a3b8]/20 aria-[invalid=true]:border-[#ea580c] dark:aria-[invalid=true]:border-[#fb923c]"
              />
              <button
                type="button"
                className="absolute top-0 right-0 grid w-[42px] h-[42px] place-items-center border-0 text-[#718077] dark:text-[#a7b0bf] hover:text-[#203028] dark:hover:text-[#f3f4f6] bg-transparent cursor-pointer transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
            {errors.password && (
              <span
                className="text-[#c2410c] dark:text-[#fb923c] text-[0.68rem] font-semibold leading-tight"
                role="alert"
              >
                {errors.password.message}
              </span>
            )}
          </label>

          {!isLogin && (
            <label className="grid gap-1.5 text-[#435249] dark:text-[#c5cec7] text-[0.71rem] font-bold">
              Confirm password
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('passwordConfirmation')}
                autoComplete="new-password"
                aria-invalid={errors.passwordConfirmation ? 'true' : 'false'}
                className="w-full h-[42px] border border-[#d9dee7] dark:border-[#383838] rounded-[2px] px-3 text-[#203028] dark:text-[#f3f4f6] bg-white/75 dark:bg-app-background text-[0.84rem] font-normal outline-none transition-all duration-200 focus:border-[#64748b] dark:focus:border-[#94a3b8] focus:ring-2 focus:ring-[#64748b]/20 dark:focus:ring-[#94a3b8]/20 aria-[invalid=true]:border-[#ea580c] dark:aria-[invalid=true]:border-[#fb923c]"
              />
              {errors.passwordConfirmation && (
                <span
                  className="text-[#c2410c] dark:text-[#fb923c] text-[0.68rem] font-semibold leading-tight"
                  role="alert"
                >
                  {errors.passwordConfirmation.message}
                </span>
              )}
            </label>
          )}

          {isLogin && (
            <Link
              className="self-end -mt-1.5 text-[#64748b] dark:text-[#94a3b8] hover:text-[#ea580c] dark:hover:text-[#fb923c] text-[0.7rem] transition-colors"
              to="/login"
            >
              Forgot your password?
            </Link>
          )}

          {!isLogin && (
            <div
              className="flex items-center gap-2.5 py-1 my-1 bg-transparent"
              role="note"
              aria-label="Terms and Privacy Notice"
            >
              <div
                className="grid place-items-center w-[22px] h-[22px] shrink-0 rounded-full bg-[#28543d]/12 dark:bg-[#94a3b8]/16 text-[#244e38] dark:text-[#94a3b8]"
                aria-hidden="true"
              >
                <Check size={14} strokeWidth={2.6} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-[#203127] dark:text-[#d1ded5] text-[0.77rem] leading-[1.45] font-medium">
                  By continuing, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="inline p-0 m-0 bg-transparent border-0 font-bold text-[#1f2937] dark:text-[#94a3b8] underline underline-offset-[2.5px] decoration-[1.5px] decoration-[#1f2937]/40 dark:decoration-[#94a3b8]/45 cursor-pointer transition-colors hover:text-[#ea580c] dark:hover:text-[#fb923c] hover:decoration-[#ea580c] dark:hover:decoration-[#fb923c] focus-visible:outline-2 focus-visible:outline-[#ea580c] focus-visible:outline-offset-2"
                  >
                    Terms
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="inline p-0 m-0 bg-transparent border-0 font-bold text-[#1f2937] dark:text-[#94a3b8] underline underline-offset-[2.5px] decoration-[1.5px] decoration-[#1f2937]/40 dark:decoration-[#94a3b8]/45 cursor-pointer transition-colors hover:text-[#ea580c] dark:hover:text-[#fb923c] hover:decoration-[#ea580c] dark:hover:decoration-[#fb923c] focus-visible:outline-2 focus-visible:outline-[#ea580c] focus-visible:outline-offset-2"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {error && (
            <p
              className="-mt-1 p-[10px_12px] border-l-2 border-[#ea580c] dark:border-l-[#fb923c] text-[#c2410c] dark:text-[#fed7aa] bg-[#fff7ed] dark:bg-[#2c1612] text-[0.75rem] leading-[1.35]"
              role="alert"
            >
              {error}
            </p>
          )}
          <button
            className="flex w-full min-h-[44px] items-center justify-center gap-2.5 mt-0.5 border border-[#1f2937] dark:border-[#fed7aa] rounded-[2px] text-white dark:text-[#1f2937] bg-[#1f2937] dark:bg-[#fed7aa] text-[0.8rem] font-bold cursor-pointer transition-all duration-200 hover:not-disabled:bg-[#c2410c] dark:hover:not-disabled:bg-[#ffedd5] hover:not-disabled:-translate-y-0.5 disabled:opacity-65 disabled:cursor-wait"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}{' '}
            <LogIn size={16} />
          </button>
        </form>

        <p className="mt-3.5 text-[#667085] dark:text-[#a7b0bf] text-[0.72rem] text-center [&>a]:text-[#64748b] dark:[&>a]:text-[#94a3b8] [&>a]:font-bold hover:[&>a]:text-[#ea580c] dark:hover:[&>a]:text-[#fb923c]">
          {isLogin ? 'Don’t have an account?' : 'Already have an account?'}{' '}
          <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create one' : 'Sign in'}</Link>
        </p>
      </section>

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </main>
  )
}
