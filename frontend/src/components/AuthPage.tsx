import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Eye, EyeOff, LogIn } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { api } from '../lib/api'
import { BrandMark } from './BrandMark'
import { GoogleIcon } from './GoogleIcon'
import { LegalModal, type LegalModalType } from './LegalModal'

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

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<AuthFormValues>({
    defaultValues: { name: '', email: '', password: '', passwordConfirmation: '' },
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const oauthError = params.get('error')

    if (token) {
      localStorage.setItem('auth_token', token)
      window.history.replaceState({}, document.title, window.location.pathname)
      navigate({ to: '/' })
    } else if (oauthError) {
      setError(oauthError)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [navigate])


  const onSubmit: SubmitHandler<AuthFormValues> = async (values) => {
    setError('')

    try {
      const response = await api.post(`/auth/${isLogin ? 'login' : 'register'}`, isLogin
        ? { email: values.email, password: values.password }
        : { name: values.name, email: values.email, password: values.password, password_confirmation: values.passwordConfirmation })
      localStorage.setItem('auth_token', response.data.token)
      navigate({ to: '/' })
    } catch (requestError: any) {
      const validationMessage = requestError.response?.data?.errors
        ? Object.values(requestError.response.data.errors).flat()[0]
        : requestError.response?.data?.message
      setError(String(validationMessage || 'Something went wrong. Please try again.'))
    }
  }

  return (
    <main className={`auth-page${isLogin ? ' auth-page-login' : ''}`}>
      <div className="auth-art" aria-hidden="true" />

      <section className="auth-panel" aria-labelledby="auth-title">
        <Link className="auth-back" to="/"><ArrowLeft size={15} /> Back to Daymark</Link>
        <div className="auth-brand"><BrandMark /><span>DAYMARK</span></div>
        <div className="auth-copy">
          {isLogin && <p className="auth-kicker">Welcome back</p>}
          <h1 id="auth-title">{isLogin ? 'Sign in to your account' : 'Create your account'}</h1>
        </div>

        <button className="google-button" type="button" onClick={() => { window.location.href = import.meta.env.VITE_GOOGLE_AUTH_URL || '/auth/google' }}>
          <GoogleIcon size={18} />
          <span>{isLogin ? 'Continue with Google' : 'Sign up with Google'}</span>
        </button>
        <div className="auth-divider"><span>or use your email</span></div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {!isLogin && <label>Full name<input {...register('name', { required: 'Please enter your name.' })} autoComplete="name" aria-invalid={errors.name ? 'true' : 'false'} />{errors.name && <span className="auth-field-error" role="alert">{errors.name.message}</span>}</label>}
          <label>Email address<input type="email" {...register('email', { required: 'Please enter your email address.', pattern: { value: /\S+@\S+\.\S+/, message: 'Please enter a valid email address.' } })} autoComplete="email" aria-invalid={errors.email ? 'true' : 'false'} />{errors.email && <span className="auth-field-error" role="alert">{errors.email.message}</span>}</label>
          <label>Password
            <span className="password-field"><input type={showPassword ? 'text' : 'password'} {...register('password', { required: 'Please enter your password.', minLength: { value: 8, message: 'Password must be at least 8 characters.' } })} autoComplete={isLogin ? 'current-password' : 'new-password'} aria-invalid={errors.password ? 'true' : 'false'} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
            {errors.password && <span className="auth-field-error" role="alert">{errors.password.message}</span>}
          </label>
          {!isLogin && <label>Confirm password<input type={showPassword ? 'text' : 'password'} {...register('passwordConfirmation', { required: 'Please confirm your password.', validate: (value) => value === getValues('password') || 'Passwords do not match.' })} autoComplete="new-password" aria-invalid={errors.passwordConfirmation ? 'true' : 'false'} />{errors.passwordConfirmation && <span className="auth-field-error" role="alert">{errors.passwordConfirmation.message}</span>}</label>}
          {isLogin && <Link className="forgot-link" to="/login">Forgot your password?</Link>}

          {!isLogin && (
            <div className="auth-terms-card" role="note" aria-label="Terms and Privacy Notice">
              <div className="terms-card-badge-icon" aria-hidden="true">
                <Check size={14} strokeWidth={2.6} />
              </div>
              <div className="terms-card-body">
                <p className="terms-card-text">
                  By continuing, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="terms-link-button"
                  >
                    Terms
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="terms-link-button"
                  >
                    Privacy Policy
                  </button>.
                </p>
              </div>
            </div>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'} <LogIn size={16} /></button>
        </form>

        <p className="auth-switch">{isLogin ? 'Don’t have an account?' : 'Already have an account?'} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create one' : 'Sign in'}</Link></p>
      </section>

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </main>
  )
}
