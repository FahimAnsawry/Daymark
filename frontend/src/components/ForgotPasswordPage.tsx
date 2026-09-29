import { useState } from 'react'
import { ArrowRight, CircleAlert, LoaderCircle, MailCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { api } from '../lib/api'
import { errorMessage } from '../lib/billing'
import { AuthShell, Field, inputClass, primaryButtonClass, textLinkClass } from './AuthShell'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address.')
    .email('Please enter a valid email address.'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit: SubmitHandler<ForgotPasswordValues> = async ({ email }) => {
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSentTo(email)
    } catch (requestError) {
      const emailError = isAxiosError<{ errors?: { email?: string[] } }>(requestError)
        ? requestError.response?.data?.errors?.email?.[0]
        : undefined
      if (emailError) {
        setFieldError('email', { type: 'server', message: emailError })
        return
      }
      setError(errorMessage(requestError, 'Something went wrong. Please try again.'))
    }
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your email" showThemeToggle={false}>
        <div className="grid gap-5" role="status">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e4eadf] text-[#183b37] dark:bg-[#1c2b26] dark:text-[#fed7aa]">
            <MailCheck size={20} aria-hidden="true" />
          </span>
          <p className="m-0 text-[0.95rem] leading-[1.55] text-[#435249] dark:text-[#c5cec7]">
            We’ve sent a link to <strong className="font-semibold break-all">{sentTo}</strong> to
            reset your password. It works for 60 minutes.
          </p>
          <p className="m-0 text-[0.84rem] leading-[1.5] text-[#5d6a62] dark:text-[#a7b0bf]">
            Nothing there? Check your spam folder, or{' '}
            <button
              type="button"
              className={`${textLinkClass} cursor-pointer border-0 bg-transparent p-0`}
              onClick={() => {
                reset({ email: sentTo })
                setSentTo(null)
              }}
            >
              try again
            </button>
            .
          </p>
          <Link className={textLinkClass} to="/login">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset your password" showThemeToggle={false}>
      <p className="m-0 mb-6 text-[0.95rem] leading-[1.55] text-[#435249] dark:text-[#c5cec7]">
        Enter the email you use for Daymark and we’ll send you a link to choose a new password.
      </p>

      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field id="forgot-email" label="Email address" error={errors.email?.message}>
          <input
            id="forgot-email"
            aria-describedby={errors.email ? 'forgot-email-error' : undefined}
            type="email"
            {...register('email')}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? 'true' : 'false'}
            className={inputClass}
          />
        </Field>

        {error && <FormError message={error} />}

        <button className={`${primaryButtonClass} mt-2`} type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
              Sending the link…
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight size={17} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="m-0 mt-7 text-center text-[0.86rem] text-[#5d6a62] dark:text-[#a7b0bf]">
        Remembered it?{' '}
        <Link className={textLinkClass} to="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export function FormError({ message }: { message: string }) {
  return (
    <p
      className="m-0 flex items-start gap-2.5 rounded-[10px] border border-[#fdba74] bg-[#fff7ed] px-3.5 py-3 text-[0.84rem] leading-[1.4] text-[#9a3412] dark:border-[#7c2d12] dark:bg-[#2c1612] dark:text-[#fed7aa]"
      role="alert"
    >
      <CircleAlert size={17} className="mt-px shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}
