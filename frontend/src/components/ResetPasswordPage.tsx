import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { AuthShell, Field, inputClass, primaryButtonClass, textLinkClass } from './AuthShell'
import { FormError } from './ForgotPasswordPage'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Please enter a new password.')
      .min(8, 'Password must be at least 8 characters.'),
    passwordConfirmation: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Passwords do not match.',
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

interface ResetPasswordPageProps {
  token?: string
  email?: string
}

interface ResetPasswordErrorBody {
  message?: string
  errors?: Record<string, string[]>
}

export function ResetPasswordPage({ token, email }: ResetPasswordPageProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState('')
  // The API says the link is bad by failing on the email field alone.
  const [linkRejected, setLinkRejected] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', passwordConfirmation: '' },
  })

  if (!token || !email || linkRejected) {
    return (
      <AuthShell title="This link won’t work">
        <div className="grid gap-5">
          <p className="m-0 text-[0.95rem] leading-[1.55] text-[#435249] dark:text-[#c5cec7]">
            Reset links expire after 60 minutes and only work once. Request a new one and we’ll send
            it right over.
          </p>
          <Link className={`${primaryButtonClass} no-underline`} to="/forgot-password">
            Request a new link
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link className={`${textLinkClass} justify-self-center`} to="/login">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  const onSubmit: SubmitHandler<ResetPasswordValues> = async (values) => {
    setError('')
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password: values.password,
        password_confirmation: values.passwordConfirmation,
      })
    } catch (requestError) {
      if (isAxiosError<ResetPasswordErrorBody>(requestError)) {
        const fieldErrors = requestError.response?.data?.errors
        if (requestError.response?.status === 422 && fieldErrors?.email && !fieldErrors.password) {
          setLinkRejected(true)
          return
        }
        setError(
          fieldErrors?.password?.[0] ??
            requestError.response?.data?.message ??
            'Something went wrong. Please try again.',
        )
      } else {
        setError('Something went wrong. Please try again.')
      }
      return
    }

    // Resetting ends every session, including any this browser still holds.
    await logout()
    toast.success('Password updated. Sign in with your new password.')
    void navigate({ to: '/login', replace: true })
  }

  return (
    <AuthShell title="Choose a new password">
      <p className="m-0 mb-6 text-[0.95rem] leading-[1.55] text-[#435249] dark:text-[#c5cec7]">
        For <strong className="font-semibold break-all">{email}</strong>. You’ll be signed out
        everywhere, then sign back in with the new one.
      </p>

      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field id="reset-password" label="New password" error={errors.password?.message}>
          <span className="relative block">
            <input
              id="reset-password"
              aria-describedby={errors.password ? 'reset-password-error' : undefined}
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              autoComplete="new-password"
              aria-invalid={errors.password ? 'true' : 'false'}
              className={`${inputClass} pr-12`}
            />
            <VisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </span>
        </Field>

        <Field
          id="reset-password-confirmation"
          label="Confirm new password"
          error={errors.passwordConfirmation?.message}
        >
          <span className="relative block">
            <input
              id="reset-password-confirmation"
              aria-describedby={
                errors.passwordConfirmation ? 'reset-password-confirmation-error' : undefined
              }
              type={showConfirmation ? 'text' : 'password'}
              {...register('passwordConfirmation')}
              autoComplete="new-password"
              aria-invalid={errors.passwordConfirmation ? 'true' : 'false'}
              className={`${inputClass} pr-12`}
            />
            <VisibilityToggle
              visible={showConfirmation}
              onToggle={() => setShowConfirmation(!showConfirmation)}
            />
          </span>
        </Field>

        {error && <FormError message={error} />}

        <button className={`${primaryButtonClass} mt-2`} type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
              Updating password…
            </>
          ) : (
            <>
              Update password
              <ArrowRight size={17} aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  )
}

function VisibilityToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="absolute top-0 right-0 grid h-12 w-12 cursor-pointer place-items-center rounded-r-[10px] border-0 bg-transparent text-[#5d6a62] transition-colors hover:text-[#1c2a24] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ea580c] dark:text-[#a7b0bf] dark:hover:text-[#f3f4f6]"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )
}
