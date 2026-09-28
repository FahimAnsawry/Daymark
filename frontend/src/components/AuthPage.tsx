import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { AuthDayPreview } from './AuthDayPreview'
import { BrandMark } from './BrandMark'
import { GoogleIcon } from './GoogleIcon'
import { LegalModal, type LegalModalType } from './LegalModal'
import { LoadingPage } from './LoadingPage'
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
  const [hasOAuthToken, setHasOAuthToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return Boolean(new URLSearchParams(window.location.search).get('token'))
    }
    return false
  })
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
      login(token)
        .then(() => {
          navigate({ to: '/dashboard', replace: true })
        })
        .catch(() => {
          setHasOAuthToken(false)
          setError('Failed to sign in with Google. Please try again.')
          toast.error('Failed to sign in with Google. Please try again.')
        })
    } else if (oauthError) {
      window.history.replaceState({}, document.title, window.location.pathname)
      setHasOAuthToken(false)
      setError(oauthError)
      toast.error(oauthError)
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

  if (hasOAuthToken || isAuthenticated || (isLoading && !error)) {
    return <LoadingPage />
  }

  return (
    <main className="min-h-dvh bg-[#FFFFFF] text-[#27352f] caret-[#ea580c] selection:bg-[#fed7aa] selection:text-[#1f2937] transition-colors duration-250 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] dark:bg-app-background dark:text-[#f3f4f6]">
      <section
        className="flex min-h-dvh flex-col px-5 py-5 sm:px-10 lg:px-[clamp(40px,5vw,72px)] lg:py-7"
        aria-labelledby="auth-title"
      >
        <div className="flex items-center justify-between">
          <Link
            className="inline-flex items-center gap-1.5 rounded-full py-1 text-[0.8rem] text-[#5d6a62] transition-colors hover:text-[#c2410c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] dark:text-[#a7b0bf] dark:hover:text-[#fb923c]"
            to="/"
          >
            <ArrowLeft size={15} aria-hidden="true" /> Back to Daymark
          </Link>
          <ThemeToggle variant="light" />
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">
          <div className="group mb-7 inline-flex items-center gap-2.5 font-logo text-[0.84rem] font-bold tracking-[0.08em] text-[#28382f] dark:text-[#f3f4f6]">
            <BrandMark />
            <span>DAYMARK</span>
          </div>

          <h1
            id="auth-title"
            className="m-0 mb-7 font-display text-[clamp(2rem,4.2vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance text-[#1c2a24] dark:text-[#f2f4ee]"
          >
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h1>

          <button
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#d4dbd2] bg-white text-[0.88rem] font-semibold text-[#28382f] transition-[border-color,background-color,transform] duration-200 hover:border-[#9aa69d] hover:bg-[#fbfbf9] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] disabled:cursor-wait disabled:opacity-60 dark:border-[#383838] dark:bg-[#262626] dark:text-[#f3f4f6] dark:hover:border-[#4d4d4d] dark:hover:bg-[#2b2b2b]"
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <GoogleIcon size={18} />
            )}
            <span>
              {isGoogleLoading
                ? 'Connecting to Google…'
                : isLogin
                  ? 'Continue with Google'
                  : 'Sign up with Google'}
            </span>
          </button>

          <div className="my-6 flex items-center gap-3.5 text-[0.75rem] text-[#5d6a62] before:h-px before:flex-1 before:bg-[#dfe4dd] after:h-px after:flex-1 after:bg-[#dfe4dd] dark:text-[#8b929c] dark:before:bg-[#333333] dark:after:bg-[#333333]">
            <span>or use your email</span>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {!isLogin && (
              <Field id="auth-name" label="Full name" error={errors.name?.message}>
                <input
                  id="auth-name"
                  aria-describedby={errors.name ? 'auth-name-error' : undefined}
                  {...register('name')}
                  autoComplete="name"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  className={inputClass}
                />
              </Field>
            )}

            <Field id="auth-email" label="Email address" error={errors.email?.message}>
              <input
                id="auth-email"
                aria-describedby={errors.email ? 'auth-email-error' : undefined}
                type="email"
                {...register('email')}
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                className={inputClass}
              />
            </Field>

            <Field
              id="auth-password"
              label="Password"
              error={errors.password?.message}
              aside={
                isLogin ? (
                  <button
                    type="button"
                    className="cursor-pointer rounded border-0 bg-transparent p-0 text-[0.78rem] font-medium text-[#5d6a62] underline-offset-[3px] transition-colors hover:text-[#c2410c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] dark:text-[#a7b0bf] dark:hover:text-[#fb923c]"
                    onClick={() => toast('Password reset isn’t available yet.')}
                  >
                    Forgot your password?
                  </button>
                ) : undefined
              }
            >
              <span className="relative block">
                <input
                  id="auth-password"
                  aria-describedby={errors.password ? 'auth-password-error' : undefined}
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 grid h-12 w-12 cursor-pointer place-items-center rounded-r-[10px] border-0 bg-transparent text-[#5d6a62] transition-colors hover:text-[#1c2a24] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ea580c] dark:text-[#a7b0bf] dark:hover:text-[#f3f4f6]"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </Field>

            {!isLogin && (
              <Field
                id="auth-password-confirmation"
                label="Confirm password"
                error={errors.passwordConfirmation?.message}
              >
                <input
                  id="auth-password-confirmation"
                  aria-describedby={
                    errors.passwordConfirmation ? 'auth-password-confirmation-error' : undefined
                  }
                  type={showPassword ? 'text' : 'password'}
                  {...register('passwordConfirmation')}
                  autoComplete="new-password"
                  aria-invalid={errors.passwordConfirmation ? 'true' : 'false'}
                  className={inputClass}
                />
              </Field>
            )}

            {error && (
              <p
                className="m-0 flex items-start gap-2.5 rounded-[10px] border border-[#fdba74] bg-[#fff7ed] px-3.5 py-3 text-[0.84rem] leading-[1.4] text-[#9a3412] dark:border-[#7c2d12] dark:bg-[#2c1612] dark:text-[#fed7aa]"
                role="alert"
              >
                <CircleAlert size={17} className="mt-px shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}

            <button
              className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 btn-primary text-[0.9rem] font-semibold transition-[background-color,transform] duration-200 active:not-disabled:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                  {isLogin ? 'Signing in…' : 'Creating your account…'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create account'}
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </button>

            {!isLogin && (
              <p className="m-0 text-center text-[0.8rem] leading-[1.5] text-[#5d6a62] dark:text-[#a7b0bf]">
                By continuing, you agree to our{' '}
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className={legalLinkClass}
                >
                  Terms
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className={legalLinkClass}
                >
                  Privacy Policy
                </button>
                .
              </p>
            )}
          </form>

          <p className="m-0 mt-7 text-center text-[0.86rem] text-[#5d6a62] dark:text-[#a7b0bf]">
            {isLogin ? 'Don’t have an account?' : 'Already have an account?'}{' '}
            <Link
              className="rounded font-semibold text-[#183b37] underline decoration-[#183b37]/30 underline-offset-[3px] transition-colors hover:text-[#c2410c] hover:decoration-[#c2410c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] dark:text-[#fed7aa] dark:decoration-[#fed7aa]/40 dark:hover:text-[#fb923c]"
              to={isLogin ? '/register' : '/login'}
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </Link>
          </p>
        </div>
      </section>

      <aside className="hidden p-4 lg:block" aria-label="Daymark preview">
        <div className="sticky top-4 flex h-[calc(100dvh-2rem)] min-h-[600px] items-center justify-center overflow-hidden rounded-[28px] bg-[#e4eadf] px-10 dark:bg-[#111a17]">
          {/* The Daymark horizon runs behind the sheet, echoing the brand mark. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[58%] h-px bg-[#183b37]/18 dark:bg-[#fed7aa]/12"
          />
          <AuthDayPreview mode={mode} />
        </div>
      </aside>

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </main>
  )
}

const inputClass =
  'h-12 w-full rounded-[10px] border border-[#d4dbd2] bg-white px-3.5 text-[0.95rem] font-normal text-[#1c2a24] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#6b746c] hover:border-[#b5c0b8] focus:border-[#183b37] focus:shadow-[0_0_0_3px_rgba(24,59,55,0.14)] aria-[invalid=true]:border-[#ea580c] aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgba(234,88,12,0.16)] dark:border-[#383838] dark:bg-[#262626] dark:text-[#f3f4f6] dark:placeholder:text-[#8b929c] dark:hover:border-[#4d4d4d] dark:focus:border-[#fed7aa] dark:focus:shadow-[0_0_0_3px_rgba(254,215,170,0.18)] dark:aria-[invalid=true]:border-[#fb923c]'

const legalLinkClass =
  'inline cursor-pointer rounded border-0 bg-transparent p-0 font-semibold text-[#27352f] underline decoration-[#27352f]/35 underline-offset-[3px] transition-colors hover:text-[#c2410c] hover:decoration-[#c2410c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] dark:text-[#e5e7eb] dark:decoration-[#e5e7eb]/40 dark:hover:text-[#fb923c]'

interface FieldProps {
  id: string
  label: string
  error?: string
  aside?: ReactNode
  children: ReactNode
}

function Field({ id, label, error, aside, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[0.8rem] font-semibold text-[#435249] dark:text-[#c5cec7]"
        >
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error && (
        <span
          id={`${id}-error`}
          className="text-[0.78rem] font-medium leading-tight text-[#c2410c] dark:text-[#fb923c]"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  )
}
