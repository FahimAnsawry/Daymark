import { zodResolver } from '@hookform/resolvers/zod'
import { Check, LoaderCircle, Monitor, Moon, Sun } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import {
  fieldErrors,
  useChangePassword,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from '../lib/account'
import type { User } from '../lib/auth-context'
import { errorMessage } from '../lib/billing'
import { useTheme, type Theme } from '../lib/theme-context'
import {
  settingsInput as inputClass,
  settingsMutedText as mutedText,
  settingsPanel as panel,
  settingsPrimaryButton as primaryButton,
  settingsQuietButton as quietButton,
} from './SettingsLayout'
import { UserAvatar } from './UserAvatar'

const headingClass = 'm-0 font-display text-[1.15rem] font-semibold tracking-[-0.02em]'

export function ProfileSettings({ user }: { user: User }) {
  return (
    <div className="mt-10 grid gap-5">
      <AboutPanel user={user} />
      <SignInPanel user={user} />
      <AppearancePanel />
    </div>
  )
}

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(255, 'That name is too long.'),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address.')
    .email('Please enter a valid email address.'),
})
type ProfileValues = z.infer<typeof profileSchema>

function AboutPanel({ user }: { user: User }) {
  const updateProfile = useUpdateProfile()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    // Follows the saved user, so the form settles (and Save disappears) after a save.
    values: { name: user.name, email: user.email },
  })

  const onSubmit = (values: ProfileValues) =>
    updateProfile.mutate(values, {
      onSuccess: () => toast.success('Profile saved.'),
      onError: (error) => {
        const messages = fieldErrors(error)
        if (messages.name || messages.email) {
          if (messages.name) setError('name', { message: messages.name })
          if (messages.email) setError('email', { message: messages.email })
        } else {
          toast.error(errorMessage(error, 'We couldn’t save that. Please try again.'))
        }
      },
    })

  return (
    <section aria-labelledby="about-title" className={panel}>
      <div className="flex items-center gap-4">
        <UserAvatar user={user} className="h-16 w-16 font-display text-2xl" />
        <div className="min-w-0">
          <h2 id="about-title" className={headingClass}>
            About you
          </h2>
          <p className={`m-0 mt-1 text-sm ${mutedText}`}>
            How Daymark greets you, and the email you sign in with.
          </p>
        </div>
      </div>

      <AvatarControls user={user} />

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field id="profile-name" label="Name" error={errors.name?.message}>
          <input
            id="profile-name"
            autoComplete="name"
            className={inputClass}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'profile-name-error' : undefined}
            {...register('name')}
          />
        </Field>
        <Field id="profile-email" label="Email address" error={errors.email?.message}>
          <input
            id="profile-email"
            type="email"
            autoComplete="email"
            className={inputClass}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'profile-email-error' : undefined}
            {...register('email')}
          />
        </Field>
        {isDirty && (
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={primaryButton} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              className={quietButton}
              disabled={updateProfile.isPending}
              onClick={() => reset()}
            >
              Discard
            </button>
          </div>
        )}
      </form>
    </section>
  )
}

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_MAX_BYTES = 2 * 1024 * 1024

/** Add, change or remove a profile image. A Google image is used as is and can't be replaced here. */
function AvatarControls({ user }: { user: User }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const busy = upload.isPending || remove.isPending

  if (user.avatar_source === 'google') {
    return (
      <p className={`m-0 mt-4 text-sm ${mutedText}`}>Your photo comes from your Google account.</p>
    )
  }

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error('Please choose a JPG, PNG or WebP image.')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('That image is over 2 MB. Please choose a smaller one.')
      return
    }
    upload.mutate(file, {
      onSuccess: () => toast.success('Photo saved.'),
      onError: (error) =>
        toast.error(
          fieldErrors(error).avatar ??
            errorMessage(error, 'We couldn’t save that photo. Please try again.'),
        ),
    })
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <input
        ref={fileInput}
        type="file"
        accept={AVATAR_TYPES.join(',')}
        className="hidden"
        aria-label="Choose a profile photo"
        onChange={onPick}
      />
      <button
        type="button"
        className={quietButton}
        disabled={busy}
        onClick={() => fileInput.current?.click()}
      >
        {upload.isPending ? 'Uploading…' : user.avatar ? 'Change photo' : 'Add a photo'}
      </button>
      {user.avatar_source === 'upload' && (
        <button
          type="button"
          className={quietButton}
          disabled={busy}
          onClick={() =>
            remove.mutate(undefined, {
              onError: (error) =>
                toast.error(
                  errorMessage(error, 'We couldn’t remove that photo. Please try again.'),
                ),
            })
          }
        >
          {remove.isPending ? 'Removing…' : 'Remove'}
        </button>
      )}
      <span className={`text-[0.8rem] ${mutedText}`}>JPG, PNG or WebP, up to 2 MB.</span>
    </div>
  )
}

const LOGIN_METHODS = [
  { provider: 'password', label: 'Password' },
  { provider: 'google', label: 'Google' },
] as const

function SignInPanel({ user }: { user: User }) {
  const [changing, setChanging] = useState(false)
  const linked = new Set((user.accounts ?? []).map((account) => account.provider))
  const hasPassword = linked.has('password')

  return (
    <section aria-labelledby="signin-title" className={panel}>
      <h2 id="signin-title" className={headingClass}>
        Ways to sign in
      </h2>
      <p className={`m-0 mt-1 text-sm ${mutedText}`}>The logins linked to your Daymark account.</p>

      <ul className="m-0 mt-5 grid list-none gap-3 p-0">
        {LOGIN_METHODS.map(({ provider, label }) => {
          const isLinked = linked.has(provider)
          return (
            <li key={provider} className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium">{label}</span>
              <span className="flex items-center gap-3">
                {isLinked ? (
                  <span className="inline-flex items-center gap-1.5 text-[#166534] dark:text-[#86efac]">
                    <Check size={15} aria-hidden="true" />
                    {provider === 'password' ? 'Set' : 'Connected'}
                  </span>
                ) : (
                  <span className={mutedText}>
                    {provider === 'password' ? 'Not set' : 'Not connected'}
                  </span>
                )}
                {provider === 'password' && !changing && (
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-[#9a3412] underline underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-[#fed7aa]"
                    onClick={() => setChanging(true)}
                  >
                    {hasPassword ? 'Change' : 'Set password'}
                  </button>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {!hasPassword && !changing && (
        <p className={`m-0 mt-4 text-[0.8rem] leading-[1.5] ${mutedText}`}>
          Set a password to sign in with your email as well as Google.
        </p>
      )}

      {changing && <PasswordForm hasPassword={hasPassword} onDone={() => setChanging(false)} />}
    </section>
  )
}

// Someone who signed in with Google has no password yet, so there is no current one to check.
const makePasswordSchema = (hasPassword: boolean) =>
  z
    .object({
      current_password: hasPassword
        ? z.string().min(1, 'Please enter your current password.')
        : z.string(),
      password: z.string().min(8, 'Password must be at least 8 characters.'),
      password_confirmation: z.string().min(1, 'Please confirm your new password.'),
    })
    .refine((values) => values.password === values.password_confirmation, {
      path: ['password_confirmation'],
      message: 'Passwords do not match.',
    })
type PasswordValues = z.infer<ReturnType<typeof makePasswordSchema>>

function PasswordForm({ hasPassword, onDone }: { hasPassword: boolean; onDone: () => void }) {
  const changePassword = useChangePassword()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(makePasswordSchema(hasPassword)),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  })

  const onSubmit = ({ current_password, ...values }: PasswordValues) =>
    changePassword.mutate(hasPassword ? { current_password, ...values } : values, {
      onSuccess: () => {
        toast.success(
          hasPassword ? 'Password updated.' : 'Password set. You can now sign in with your email.',
        )
        onDone()
      },
      onError: (error) => {
        const messages = fieldErrors(error)
        const fields = ['current_password', 'password', 'password_confirmation'] as const
        const failed = fields.filter((field) => messages[field])
        if (failed.length === 0) {
          toast.error(errorMessage(error, 'We couldn’t update your password. Please try again.'))
        }
        failed.forEach((field) => setError(field, { message: messages[field] }))
      },
    })

  const fields: { name: keyof PasswordValues; label: string; autoComplete: string }[] = [
    ...(hasPassword
      ? [
          {
            name: 'current_password' as const,
            label: 'Current password',
            autoComplete: 'current-password',
          },
        ]
      : []),
    {
      name: 'password',
      label: hasPassword ? 'New password' : 'Password',
      autoComplete: 'new-password',
    },
    { name: 'password_confirmation', label: 'Confirm password', autoComplete: 'new-password' },
  ]

  return (
    <form
      className="mt-5 grid gap-4 border-t border-[#dfe4dd] pt-5 dark:border-[#383838]"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {fields.map(({ name, label, autoComplete }) => (
        <Field key={name} id={`password-${name}`} label={label} error={errors[name]?.message}>
          <input
            id={`password-${name}`}
            type="password"
            autoComplete={autoComplete}
            className={inputClass}
            aria-invalid={errors[name] ? 'true' : 'false'}
            aria-describedby={errors[name] ? `password-${name}-error` : undefined}
            {...register(name)}
          />
        </Field>
      ))}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={primaryButton} disabled={changePassword.isPending}>
          {changePassword.isPending ? (
            <LoaderCircle size={16} className="animate-spin" aria-label="Updating" />
          ) : hasPassword ? (
            'Update password'
          ) : (
            'Set password'
          )}
        </button>
        <button
          type="button"
          className={quietButton}
          disabled={changePassword.isPending}
          onClick={onDone}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'dark', label: 'Dark', icon: Moon },
]

function AppearancePanel() {
  const { theme, setTheme } = useTheme()

  return (
    <section aria-labelledby="appearance-title" className={panel}>
      <h2 id="appearance-title" className={headingClass}>
        Appearance
      </h2>
      <p className={`m-0 mt-1 text-sm ${mutedText}`}>
        Light, dark, or whatever your device prefers.
      </p>
      <fieldset className="m-0 mt-5 border-0 p-0">
        <legend className="sr-only">Theme</legend>
        <div className="inline-flex gap-1 rounded-full bg-black/[0.05] p-1 dark:bg-white/[0.08]">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <label key={id} className="relative cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={id}
                checked={theme === id}
                onChange={() => setTheme(id)}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-[36px] items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors peer-checked:bg-[#c2410c] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-500 dark:peer-checked:bg-[#fed7aa] dark:peer-checked:text-[#1f2937]">
                <Icon size={15} aria-hidden="true" /> {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
        className="text-[0.8rem] font-semibold text-[#435249] dark:text-[#c5cec7]"
      >
        {label}
      </label>
      {children}
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          className="text-[0.78rem] font-medium leading-tight text-[#c2410c] dark:text-[#fb923c]"
        >
          {error}
        </span>
      )}
    </div>
  )
}
