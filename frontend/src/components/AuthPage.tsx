import { useEffect, useState } from 'react'
import { ArrowRight, CircleAlert, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import {
  AuthShell,
  Field,
  VisibilityToggle,
  compactInputClass,
  compactPrimaryButtonClass,
  inputClass,
  primaryButtonClass,
  textLinkClass,
} from './AuthShell'
import { GoogleIcon } from './GoogleIcon'
import { LegalModal, type LegalModalType } from './LegalModal'
import { LoadingPage } from './LoadingPage'
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
  // Sign up has two more fields, so it is set a little tighter to fit a laptop screen.
  const compact = !isLogin
  const fieldClass = compact ? compactInputClass : inputClass
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
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
        const apiOrigin = new URL(api.defaults.baseURL ?? '/api', window.location.origin).origin
        window.location.href = `${apiOrigin}/auth/google`
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
    <AuthShell
      title={isLogin ? 'Sign in to your account' : 'Create your account'}
      previewMode={mode}
      compact={compact}
    >
      <button
        className={`flex ${compact ? 'h-12 lg:h-10' : 'h-12'} w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#d4dbd2] bg-white text-[0.88rem] font-semibold text-[#28382f] transition-[border-color,background-color,transform] duration-200 hover:border-[#9aa69d] hover:bg-[#fbfbf9] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] disabled:cursor-wait disabled:opacity-60 dark:border-[#383838] dark:bg-[#262626] dark:text-[#f3f4f6] dark:hover:border-[#4d4d4d] dark:hover:bg-[#2b2b2b]`}
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

      <div
        className={`${compact ? 'my-6 lg:my-4' : 'my-6'} flex items-center gap-3.5 text-[0.75rem] text-[#5d6a62] before:h-px before:flex-1 before:bg-[#dfe4dd] after:h-px after:flex-1 after:bg-[#dfe4dd] dark:text-[#8b929c] dark:before:bg-[#333333] dark:after:bg-[#333333]`}
      >
        <span>or use your email</span>
      </div>

      <form
        className={`grid ${compact ? 'gap-4 lg:gap-3' : 'gap-4'}`}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {!isLogin && (
          <Field id="auth-name" compact={compact} label="Full name" error={errors.name?.message}>
            <input
              id="auth-name"
              aria-describedby={errors.name ? 'auth-name-error' : undefined}
              {...register('name')}
              autoComplete="name"
              aria-invalid={errors.name ? 'true' : 'false'}
              className={fieldClass}
            />
          </Field>
        )}

        <Field
          id="auth-email"
          compact={compact}
          label="Email address"
          error={errors.email?.message}
        >
          <input
            id="auth-email"
            aria-describedby={errors.email ? 'auth-email-error' : undefined}
            type="email"
            {...register('email')}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? 'true' : 'false'}
            className={fieldClass}
          />
        </Field>

        <Field
          id="auth-password"
          compact={compact}
          label="Password"
          error={errors.password?.message}
          aside={
            isLogin ? (
              <Link
                to="/forgot-password"
                className="rounded text-[0.78rem] font-medium text-[#5d6a62] underline-offset-[3px] transition-colors hover:text-[#c2410c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] dark:text-[#a7b0bf] dark:hover:text-[#fb923c]"
              >
                Forgot your password?
              </Link>
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
              className={`${fieldClass} pr-12`}
            />
            <VisibilityToggle
              compact={compact}
              visible={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </span>
        </Field>

        {!isLogin && (
          <Field
            id="auth-password-confirmation"
            compact={compact}
            label="Confirm password"
            error={errors.passwordConfirmation?.message}
          >
            <span className="relative block">
              <input
                id="auth-password-confirmation"
                aria-describedby={
                  errors.passwordConfirmation ? 'auth-password-confirmation-error' : undefined
                }
                type={showConfirmation ? 'text' : 'password'}
                {...register('passwordConfirmation')}
                autoComplete="new-password"
                aria-invalid={errors.passwordConfirmation ? 'true' : 'false'}
                className={`${fieldClass} pr-12`}
              />
              <VisibilityToggle
                compact={compact}
                visible={showConfirmation}
                onToggle={() => setShowConfirmation(!showConfirmation)}
              />
            </span>
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
          className={`${compact ? compactPrimaryButtonClass : primaryButtonClass} ${compact ? 'mt-2 lg:mt-1' : 'mt-2'}`}
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
            <button type="button" onClick={() => setLegalModal('terms')} className={legalLinkClass}>
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

      <p
        className={`m-0 ${compact ? 'mt-7 lg:mt-5' : 'mt-7'} text-center text-[0.86rem] text-[#5d6a62] dark:text-[#a7b0bf]`}
      >
        {isLogin ? 'Don’t have an account?' : 'Already have an account?'}{' '}
        <Link className={textLinkClass} to={isLogin ? '/register' : '/login'}>
          {isLogin ? 'Create one' : 'Sign in'}
        </Link>
      </p>

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </AuthShell>
  )
}

const legalLinkClass =
  'inline cursor-pointer rounded border-0 bg-transparent p-0 font-semibold text-[#27352f] underline decoration-[#27352f]/35 underline-offset-[3px] transition-colors hover:text-[#c2410c] hover:decoration-[#c2410c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] dark:text-[#e5e7eb] dark:decoration-[#e5e7eb]/40 dark:hover:text-[#fb923c]'
