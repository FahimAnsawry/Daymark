import type { ReactNode } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { AuthDayPreview } from './AuthDayPreview'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'

interface AuthShellProps {
  title: string
  /** Which day-sheet animation runs beside the form. */
  previewMode?: 'login' | 'register'
  /** Show the light/dark switch in the corner. On by default. */
  showThemeToggle?: boolean
  /** Tighter vertical spacing, for the longer sign-up form. */
  compact?: boolean
  children: ReactNode
}

/** The page frame shared by every signed-out account screen: form on the left, day sheet on the right. */
export function AuthShell({
  title,
  previewMode = 'login',
  showThemeToggle = true,
  compact = false,
  children,
}: AuthShellProps) {
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
          {showThemeToggle && <ThemeToggle variant="light" />}
        </div>

        <div
          className={`mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center ${compact ? 'py-8 lg:py-5' : 'py-8'}`}
        >
          <div
            className={`group ${compact ? 'mb-7 lg:mb-5' : 'mb-7'} inline-flex items-center gap-2.5 font-logo text-[0.84rem] font-bold tracking-[0.08em] text-[#28382f] dark:text-[#f3f4f6]`}
          >
            <BrandMark />
            <span>DAYMARK</span>
          </div>

          <h1
            id="auth-title"
            className={`m-0 ${compact ? 'mb-7 lg:mb-5' : 'mb-7'} font-display text-[clamp(2rem,4.2vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance text-[#1c2a24] dark:text-[#f2f4ee]`}
          >
            {title}
          </h1>

          {children}
        </div>
      </section>

      <aside className="hidden p-4 lg:block" aria-label="Daymark preview">
        <div className="sticky top-4 flex h-[calc(100dvh-2rem)] min-h-[600px] items-center justify-center overflow-hidden rounded-[28px] bg-[#e4eadf] px-10 dark:bg-[#111a17]">
          {/* The Daymark horizon runs behind the sheet, echoing the brand mark. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[58%] h-px bg-[#183b37]/18 dark:bg-[#fed7aa]/12"
          />
          <AuthDayPreview mode={previewMode} />
        </div>
      </aside>
    </main>
  )
}

const inputBase =
  'w-full rounded-[10px] border border-[#d4dbd2] bg-white px-3.5 text-[0.95rem] font-normal text-[#1c2a24] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#6b746c] hover:border-[#b5c0b8] focus:border-[#183b37] focus:shadow-[0_0_0_3px_rgba(24,59,55,0.14)] aria-[invalid=true]:border-[#ea580c] aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgba(234,88,12,0.16)] dark:border-[#383838] dark:bg-[#262626] dark:text-[#f3f4f6] dark:placeholder:text-[#8b929c] dark:hover:border-[#4d4d4d] dark:focus:border-[#fed7aa] dark:focus:shadow-[0_0_0_3px_rgba(254,215,170,0.18)] dark:aria-[invalid=true]:border-[#fb923c]'

export const inputClass = `h-12 ${inputBase}`
export const compactInputClass = `h-12 lg:h-10 ${inputBase}`

const primaryButtonBase =
  'flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 btn-primary text-[0.9rem] font-semibold transition-[background-color,transform] duration-200 active:not-disabled:scale-[0.99] disabled:cursor-wait disabled:opacity-70'

export const primaryButtonClass = `h-12 ${primaryButtonBase}`
export const compactPrimaryButtonClass = `h-12 lg:h-10 ${primaryButtonBase}`

export const textLinkClass =
  'rounded font-semibold text-[#183b37] underline decoration-[#183b37]/30 underline-offset-[3px] transition-colors hover:text-[#c2410c] hover:decoration-[#c2410c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c] dark:text-[#fed7aa] dark:decoration-[#fed7aa]/40 dark:hover:text-[#fb923c]'

interface FieldProps {
  id: string
  label: string
  error?: string
  aside?: ReactNode
  compact?: boolean
  children: ReactNode
}

export function Field({ id, label, error, aside, compact = false, children }: FieldProps) {
  return (
    <div className={`grid ${compact ? 'gap-1.5 lg:gap-1' : 'gap-1.5'}`}>
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

/** The eye button inside a password input's right edge. The input needs `pr-12`. */
export function VisibilityToggle({
  visible,
  onToggle,
  compact = false,
}: {
  visible: boolean
  onToggle: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      className={`absolute top-0 right-0 grid ${compact ? 'h-12 w-12 lg:h-10 lg:w-10' : 'h-12 w-12'} cursor-pointer place-items-center rounded-r-[10px] border-0 bg-transparent text-[#5d6a62] transition-colors hover:text-[#1c2a24] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ea580c] dark:text-[#a7b0bf] dark:hover:text-[#f3f4f6]`}
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )
}
