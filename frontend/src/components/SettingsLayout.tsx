import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useAuth, type User } from '../lib/auth-context'
import { BrandMark } from './BrandMark'
import { LoadingPage } from './LoadingPage'

export const settingsMutedText = 'text-[#667085] dark:text-[#a7b0bf]'
export const settingsPanel = 'rounded-2xl bg-[#f7f6f2] p-6 dark:bg-[#262626] max-[420px]:p-5'
export const settingsPrimaryButton =
  'inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-full border-0 btn-primary px-5 text-[0.88rem] font-bold disabled:cursor-default disabled:opacity-70'
export const settingsQuietButton =
  'inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-full border border-[#d9dee7] bg-transparent px-5 text-[0.88rem] font-semibold text-inherit hover:bg-black/[0.04] disabled:cursor-default disabled:opacity-70 dark:border-[#383838] dark:hover:bg-white/[0.06]'

type Props = {
  title: string
  description?: ReactNode
  children: (user: User) => ReactNode
}

/**
 * The frame for settings pages such as Billing: brand, a way back and the page title.
 * Reminders and Calendar live in the dashboard sidebar. Signed-out visitors go to /login.
 */
export function SettingsLayout({ title, description, children }: Props) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) void navigate({ to: '/login' })
  }, [isLoading, isAuthenticated, navigate])

  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} · Daymark`
    return () => {
      document.title = previousTitle
    }
  }, [title])

  if (isLoading) return <LoadingPage />
  if (!isAuthenticated || !user) return null

  return (
    <div className="min-h-screen bg-app-background text-[#1f2937] dark:text-[#f3f4f6]">
      <header className="mx-auto flex max-w-[720px] items-center justify-between px-5 pt-6 md:px-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 rounded-lg font-logo text-[0.95rem] font-bold uppercase tracking-[0.08em] text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
        >
          <BrandMark />
          Daymark
        </Link>
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-1.5 text-sm no-underline hover:underline ${settingsMutedText}`}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to today
        </Link>
      </header>

      <main className="mx-auto max-w-[720px] px-5 pb-20 pt-12 md:px-8">
        <h1 className="m-0 font-display text-[2rem] font-semibold tracking-[-0.03em]">{title}</h1>
        {description && (
          <p className={`m-0 mt-2 text-[0.95rem] ${settingsMutedText}`}>{description}</p>
        )}
        {children(user)}
      </main>
    </div>
  )
}
