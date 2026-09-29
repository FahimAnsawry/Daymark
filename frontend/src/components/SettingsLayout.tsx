import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CreditCard, UserRound } from 'lucide-react'
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
export const settingsInput =
  'h-11 w-full rounded-[10px] border border-[#d4dbd2] bg-white px-3.5 text-[0.95rem] text-[#1c2a24] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#6b746c] hover:border-[#b5c0b8] focus:border-[#183b37] focus:shadow-[0_0_0_3px_rgba(24,59,55,0.14)] read-only:opacity-70 aria-[invalid=true]:border-[#ea580c] aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgba(234,88,12,0.16)] dark:border-[#383838] dark:bg-[#1f1f1f] dark:text-[#f3f4f6] dark:placeholder:text-[#8b929c] dark:hover:border-[#4d4d4d] dark:focus:border-[#fed7aa] dark:focus:shadow-[0_0_0_3px_rgba(254,215,170,0.18)] dark:aria-[invalid=true]:border-[#fb923c]'

const navItem =
  'inline-flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2 text-[0.9rem] font-medium text-inherit no-underline transition-colors hover:bg-black/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:hover:bg-white/[0.08]'
const navItemActive = '!bg-[#ecebe5] !font-semibold dark:!bg-[#262626]'

type Props = {
  title: string
  description?: ReactNode
  children: (user: User) => ReactNode
}

/**
 * The frame for settings pages: brand, a way back, a sidebar (a scrolling row on phones)
 * and the page title. Reminders and Calendar live in the dashboard sidebar, not here.
 * Signed-out visitors go to /login.
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
      <header className="mx-auto flex max-w-[960px] items-center justify-between px-5 pt-6 md:px-8">
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

      <div className="mx-auto max-w-[960px] px-5 pb-20 pt-8 md:grid md:grid-cols-[190px_minmax(0,1fr)] md:gap-14 md:px-8 md:pt-12">
        <nav
          aria-label="Settings"
          className="-mx-5 mb-8 flex gap-1 overflow-x-auto px-5 pb-1 md:sticky md:top-8 md:m-0 md:flex-col md:self-start md:overflow-visible md:p-0"
        >
          <Link
            to="/settings"
            activeOptions={{ exact: true }}
            className={navItem}
            activeProps={{ className: navItemActive }}
          >
            <UserRound size={17} aria-hidden="true" /> Profile
          </Link>
          <Link
            to="/settings/billing"
            className={navItem}
            activeProps={{ className: navItemActive }}
          >
            <CreditCard size={17} aria-hidden="true" /> Billing
          </Link>
        </nav>

        <main className="min-w-0 max-w-[640px]">
          <h1 className="m-0 font-display text-[2rem] font-semibold tracking-[-0.03em]">{title}</h1>
          {description && (
            <p className={`m-0 mt-2 text-[0.95rem] ${settingsMutedText}`}>{description}</p>
          )}
          {children(user)}
        </main>
      </div>
    </div>
  )
}
