import { Link } from '@tanstack/react-router'
import {
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Folder,
  Inbox,
  LayoutGrid,
  LogOut,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { ThemeToggle } from './ThemeToggle'

export type DashboardView =
  | 'inbox'
  | 'today'
  | 'upcoming'
  | 'filters'
  | 'reporting'
  | 'search'
  | 'help'
  | 'notifications'
  | `project:${string}`
type Props = {
  view: DashboardView
  onViewChange: (v: DashboardView) => void
  projects: string[]
  projectsWithTasks: ReadonlySet<string>
  onAddTask: () => void
  onAddProject: () => void
  onDeleteProject: (name: string) => void
  isMobileOpen: boolean
  onCloseMobile: () => void
  isCollapsed: boolean
}
const items = [
  ['search', 'Search', Search],
  ['inbox', 'Inbox', Inbox],
  ['today', 'Today', CalendarDays],
  ['upcoming', 'Upcoming', CalendarDays],
  ['filters', 'Filters & Labels', LayoutGrid],
  ['reporting', 'Reporting', ChartNoAxesCombined],
] as const

const sidebarIconButtonClass =
  'grid h-8 w-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-[5px] text-[#667085] transition-colors duration-150 hover:bg-black/[0.08] hover:text-[#1f2937] focus-visible:bg-black/[0.08] focus-visible:text-[#1f2937] focus-visible:outline-none dark:text-[#a7b0bf] dark:hover:bg-[#333333] dark:hover:text-[#f3f4f6] dark:focus-visible:bg-[#333333] dark:focus-visible:text-[#f3f4f6] motion-reduce:transition-none'
const sidebarNavItemClass =
  'flex w-full cursor-pointer items-center gap-[10px] rounded-[7px] border-0 bg-transparent px-[9px] py-2 text-left text-sm text-[#1f2937] transition-colors duration-150 hover:bg-black/[0.08] dark:text-[#f3f4f6] dark:hover:bg-white/[0.07] motion-reduce:transition-none'
const sidebarMenuItemClass =
  'flex w-full cursor-pointer items-center gap-3 rounded-[7px] border-0 bg-transparent px-3 py-[11px] text-left font-sans text-[15px] text-[#1f2937] no-underline hover:bg-black/[0.08] focus-visible:bg-black/[0.08] focus-visible:text-[#1f2937] focus-visible:outline-none dark:text-[#f3f4f6] dark:hover:bg-white/[0.08] dark:focus-visible:bg-white/[0.08] dark:focus-visible:text-[#f3f4f6]'

export function DashboardSidebar(p: Props) {
  const { user, logout } = useAuth()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const go = (v: DashboardView) => {
    p.onViewChange(v)
    p.onCloseMobile()
  }

  useEffect(() => {
    if (!accountMenuOpen) return
    const close = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [accountMenuOpen])

  const content = (
    <div className="flex h-full flex-col justify-between p-[16px_12px_18px]">
      <div>
        <div
          className={`flex ${
            p.isCollapsed
              ? 'flex-col items-center gap-3 pb-4'
              : 'items-center justify-between px-1 pb-4'
          }`}
        >
          <div className="relative" ref={accountMenuRef}>
            <button
              className="flex cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-sm font-bold text-[#1f2937] no-underline dark:text-[#f3f4f6]"
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              onClick={() => setAccountMenuOpen((x) => !x)}
            >
              <span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-full bg-orange-500 text-[13px] font-bold text-white dark:bg-orange-400">
                {user?.name?.[0]?.toUpperCase() || 'D'}
              </span>
              {!p.isCollapsed && (
                <span className="flex items-center gap-[7px] text-[#1f2937] dark:text-[#f3f4f6]">
                  {user?.name || 'Daymark'} <ChevronDown size={14} />
                </span>
              )}
            </button>
            {accountMenuOpen && (
              <div
                className="absolute left-[-5px] top-[43px] z-[50] w-[270px] rounded-xl border border-[#d9dee7] bg-white p-[7px] shadow-[0_18px_40px_rgba(0,0,0,0.18)] dark:border-[#383838] dark:bg-[#262626]"
                role="menu"
              >
                <Link
                  to="/profile"
                  className={sidebarMenuItemClass}
                  role="menuitem"
                  onClick={() => {
                    setAccountMenuOpen(false)
                    p.onCloseMobile()
                  }}
                >
                  <Settings size={17} /> Settings
                </Link>
                <div className="py-1" role="none">
                  <ThemeToggle
                    showLabel
                    variant="light"
                    className="!min-h-0 !w-full !justify-start !rounded-[7px] !border-0 !bg-transparent !px-3 !py-[11px] !text-[#1f2937] !shadow-none hover:!translate-y-0 hover:!scale-100 hover:!bg-black/[0.08] hover:!text-[#1f2937] dark:!text-[#f3f4f6] dark:hover:!bg-white/[0.08] dark:hover:!text-[#f3f4f6]"
                  />
                </div>
                <button
                  className={sidebarMenuItemClass}
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  <UsersRound size={17} /> Add a team
                </button>
                <button
                  className={`${sidebarMenuItemClass} text-orange-600 dark:text-orange-400`}
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  <Sparkles size={17} /> Try Pro for free
                </button>
              </div>
            )}
          </div>
          <div className={`flex gap-2 ${p.isCollapsed ? 'justify-center' : ''}`}>
            <button
              className={`max-[900px]:grid ${sidebarIconButtonClass} hidden`}
              aria-label="Close navigation"
              onClick={p.onCloseMobile}
            >
              <X size={19} />
            </button>
          </div>
        </div>
        <button
          className="flex cursor-pointer items-center gap-2 border-0 bg-transparent px-[5px] pb-[14px] pt-[5px] text-[15px] font-medium uppercase tracking-[0.05em] text-orange-600 transition-opacity duration-150 hover:opacity-[0.85] dark:text-orange-400 motion-reduce:transition-none"
          onClick={() => {
            p.onAddTask()
            p.onCloseMobile()
          }}
        >
          <span className="grid h-[25px] w-[25px] place-items-center rounded-full bg-orange-500 text-white dark:bg-orange-400">
            <Plus size={19} />
          </span>
          {!p.isCollapsed && 'Add task'}
        </button>
        <nav className="grid gap-px" aria-label="Workspace">
          {items.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`${sidebarNavItemClass} ${
                p.view === id
                  ? 'bg-orange-500/15 font-semibold text-orange-600 dark:bg-[#333333] dark:text-orange-400'
                  : ''
              }`}
              aria-current={p.view === id ? 'page' : undefined}
              onClick={() => go(id)}
            >
              <Icon size={19} strokeWidth={1.7} />
              {!p.isCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-[25px]">
          {!p.isCollapsed && (
            <div className="flex items-center justify-between px-[5px] pb-[7px] text-sm font-semibold text-[#667085] dark:text-[#a7b0bf]">
              <span>My Projects</span>
              <button
                className={sidebarIconButtonClass}
                aria-label="Add project"
                onClick={p.onAddProject}
              >
                <Plus size={17} />
              </button>
            </div>
          )}
          {p.projects.map((x) => (
            <div key={x} className="relative">
              <button
                className={`${sidebarNavItemClass} min-w-0 ${
                  !p.isCollapsed && !p.projectsWithTasks.has(x) ? 'pr-10' : ''
                } ${
                  p.view === `project:${x}`
                    ? 'bg-orange-500/15 font-semibold text-orange-600 dark:bg-[#333333] dark:text-orange-400'
                    : ''
                }`}
                aria-current={p.view === `project:${x}` ? 'page' : undefined}
                onClick={() => go(`project:${x}`)}
              >
                <Folder size={19} strokeWidth={1.7} className="shrink-0" aria-hidden="true" />
                {!p.isCollapsed && <span className="truncate">{x}</span>}
              </button>
              {!p.isCollapsed && !p.projectsWithTasks.has(x) && (
                <button
                  className={`${sidebarIconButtonClass} absolute right-0 top-1/2 -translate-y-1/2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-500 dark:focus-visible:outline-orange-400`}
                  aria-label={`Delete empty project ${x}`}
                  title={`Delete empty project ${x}`}
                  onClick={() => p.onDeleteProject(x)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-[5px]">
        <button className={sidebarNavItemClass} onClick={() => go('help')}>
          <CircleHelp size={19} />
          {!p.isCollapsed && <span>Help & resources</span>}
        </button>
        <button className={sidebarNavItemClass} onClick={() => void logout()}>
          <LogOut size={19} />
          {!p.isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  )
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-[30] border-r border-[#d9dee7] bg-app-background transition-[width,transform] duration-200 dark:border-[#383838] dark:bg-[#262626] motion-reduce:transition-none ${
          p.isCollapsed ? 'w-16 max-[900px]:w-16' : 'w-[286px] max-[900px]:w-[270px]'
        } ${p.isMobileOpen ? 'max-[900px]:translate-x-0' : 'max-[900px]:-translate-x-full'}`}
      >
        {content}
      </aside>
      {p.isMobileOpen && (
        <button
          className="fixed inset-0 z-20 block border-0 bg-black/50"
          aria-label="Close navigation"
          onClick={p.onCloseMobile}
        />
      )}
    </>
  )
}
