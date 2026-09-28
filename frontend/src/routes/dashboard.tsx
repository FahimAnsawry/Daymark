import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Inbox,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Repeat2,
  Search,
  Send,
  SlidersHorizontal,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import {
  DashboardSidebar,
  LINKABLE_VIEWS,
  type DashboardView,
  type LinkableView,
} from '../components/DashboardSidebar'
import { LoadingPage } from '../components/LoadingPage'
import { UpgradeDialog } from '../components/UpgradeDialog'
import { useAuth } from '../lib/auth-context'
import { deleteEmptyProject } from '../lib/projects'
export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>): { view?: LinkableView } => {
    const view = LINKABLE_VIEWS.find((v) => v === search.view)
    return view ? { view } : {}
  },
})
type Task = {
  id: string
  title: string
  done: boolean
  due: string
  project: string
  label: string
  time?: string
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly'
}
const today = () => new Date().toLocaleDateString('en-CA')
const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const moveDate = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return localDate(next)
}
const nextRepeatDate = (due: string, repeat: Task['repeat']) => {
  const next = new Date(`${due}T12:00:00`)
  if (repeat === 'daily') next.setDate(next.getDate() + 1)
  if (repeat === 'weekly') next.setDate(next.getDate() + 7)
  if (repeat === 'monthly') {
    const day = next.getDate()
    next.setDate(1)
    next.setMonth(next.getMonth() + 1)
    next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
  }
  return localDate(next)
}
const dashboardIconButtonClass =
  'grid size-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-[5px] text-[#1f2937] transition-colors duration-150 hover:bg-orange-500/15 hover:text-orange-500 focus-visible:bg-orange-500/15 focus-visible:text-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-[#f3f4f6] dark:hover:text-orange-400 dark:focus-visible:text-orange-400 dark:focus-visible:outline-orange-400 motion-reduce:transition-none'
const dashboardPrimaryClass =
  'inline-flex cursor-pointer items-center justify-center gap-[9px] rounded-full border-0 btn-primary px-[15px] py-[9px] text-sm font-medium uppercase tracking-[0.05em] transition-colors duration-150 motion-reduce:transition-none'
const dl = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const load = <T,>(k: string, f: T): T => {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null') ?? f
  } catch {
    return f
  }
}
function DashboardPage() {
  const nav = useNavigate()
  const { view: initialView } = Route.useSearch()
  const { user, isAuthenticated, isLoading } = useAuth()
  const key = `daymark.${user?.id || 'guest'}`
  const [view, setView] = useState<DashboardView>(initialView ?? 'inbox'),
    [tasks, setTasks] = useState<Task[]>(() => load(`${key}.tasks`, [])),
    [projects, setProjects] = useState<string[]>(() => load(`${key}.projects`, [])),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [adding, setAdding] = useState(false),
    [addProject, setAddProject] = useState(false),
    [upgradeOpen, setUpgradeOpen] = useState(false),
    [draft, setDraft] = useState(''),
    [projectDraft, setProjectDraft] = useState(''),
    [due, setDue] = useState(''),
    [project, setProject] = useState(''),
    [projectPickerOpen, setProjectPickerOpen] = useState(false),
    [datePickerOpen, setDatePickerOpen] = useState(false),
    [projectSearch, setProjectSearch] = useState(''),
    [label, setLabel] = useState(''),
    [labelOpen, setLabelOpen] = useState(false),
    [time, setTime] = useState(''),
    [repeat, setRepeat] = useState<NonNullable<Task['repeat']>>('none'),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState(''),
    [calendarMonth, setCalendarMonth] = useState(() => {
      const next = new Date()
      next.setDate(next.getDate() + 1)
      return new Date(next.getFullYear(), next.getMonth(), 1)
    }),
    [selectedDate, setSelectedDate] = useState(() => moveDate(new Date(), 1))
  const search = useRef<HTMLInputElement>(null)
  const projectTrigger = useRef<HTMLButtonElement>(null)
  const dateTrigger = useRef<HTMLButtonElement>(null)
  const projectSearchInput = useRef<HTMLInputElement>(null)
  const projectPicker = useRef<HTMLDivElement>(null)
  const datePicker = useRef<HTMLDivElement>(null)
  const taskInput = useRef<HTMLInputElement>(null)
  const dialogReturnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) void nav({ to: '/login' })
  }, [isLoading, isAuthenticated, nav])
  useEffect(() => {
    if (user) {
      setTasks(load(`${key}.tasks`, []))
      setProjects(load(`${key}.projects`, []))
    }
  }, [user, key])
  useEffect(() => {
    if (user) localStorage.setItem(`${key}.tasks`, JSON.stringify(tasks))
  }, [tasks, key, user])
  useEffect(() => {
    if (user) localStorage.setItem(`${key}.projects`, JSON.stringify(projects))
  }, [projects, key, user])
  useEffect(() => {
    if (view === 'search') search.current?.focus()
  }, [view])
  useEffect(() => {
    if (!adding) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (projectPickerOpen) {
          setProjectPickerOpen(false)
          projectTrigger.current?.focus()
          return
        }
        if (datePickerOpen) {
          setDatePickerOpen(false)
          dateTrigger.current?.focus()
          return
        }
        setAdding(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [adding, projectPickerOpen, datePickerOpen])
  useEffect(() => {
    if (!projectPickerOpen) return
    projectSearchInput.current?.focus()
    const onPointerDown = (event: PointerEvent) => {
      if (!projectPicker.current?.contains(event.target as Node)) {
        setProjectPickerOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [projectPickerOpen])
  useEffect(() => {
    if (!datePickerOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!datePicker.current?.contains(event.target as Node)) setDatePickerOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [datePickerOpen])
  useEffect(() => {
    if (!adding) {
      dialogReturnFocus.current?.focus()
      dialogReturnFocus.current = null
    }
  }, [adding])
  const visible = useMemo(
    () =>
      tasks.filter((t) =>
        view === 'inbox'
          ? !t.done && !t.due && !t.project
          : view === 'today'
            ? !t.done && t.due === today()
            : view === 'upcoming'
              ? !t.done && !!t.due && t.due > today()
              : view === 'search'
                ? t.title.toLowerCase().includes(query.toLowerCase())
                : view === 'filters'
                  ? !filter || t.label.toLowerCase() === filter.toLowerCase()
                  : view.startsWith('project:')
                    ? t.project === view.slice(8)
                    : false,
      ),
    [tasks, view, query, filter],
  )
  const labels = [...new Set(tasks.map((t) => t.label).filter(Boolean))]
  const projectMatches = projects.filter((name) =>
    name.toLowerCase().includes(projectSearch.trim().toLowerCase()),
  )
  const inboxMatches = 'inbox'.includes(projectSearch.trim().toLowerCase())
  const canCreateProject =
    !!projectSearch.trim() &&
    !projects.some((name) => name.toLowerCase() === projectSearch.trim().toLowerCase()) &&
    projectSearch.trim().toLowerCase() !== 'inbox'
  const heading = view.startsWith('project:')
    ? view.slice(8)
    : (
        {
          inbox: 'Inbox',
          today: 'Today',
          upcoming: 'Upcoming',
          filters: 'Filters & Labels',
          reporting: 'Reporting',
          search: 'Search',
          help: 'Help & resources',
          notifications: 'Notifications',
        } as Record<string, string>
      )[view]
  const go = (v: DashboardView) => {
    setView(v)
    setMobile(false)
  }
  const changeUpcomingMonth = (direction: number) => {
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + direction, 1)
    const tomorrow = moveDate(new Date(), 1)
    const firstDate = localDate(next)
    if (firstDate.slice(0, 7) < tomorrow.slice(0, 7)) return
    setCalendarMonth(next)
    setSelectedDate(firstDate < tomorrow ? tomorrow : firstDate)
  }
  const add = () => {
    if (!draft.trim()) return
    setTasks((x) => [
      ...x,
      {
        id: crypto.randomUUID(),
        title: draft.trim(),
        done: false,
        due,
        project,
        label,
        time,
        repeat,
      },
    ])
    setDraft('')
    setDue('')
    setProject('')
    setProjectPickerOpen(false)
    setDatePickerOpen(false)
    setProjectSearch('')
    setLabel('')
    setLabelOpen(false)
    setTime('')
    setRepeat('none')
    setAdding(false)
  }
  const createProject = () => {
    if (!projectDraft.trim()) return
    const n = projectDraft.trim()
    setProjects((x) => (x.includes(n) ? x : [...x, n]))
    go(`project:${n}`)
    setProjectDraft('')
    setAddProject(false)
  }
  const deleteProject = (name: string) => {
    const remaining = deleteEmptyProject(projects, tasks, name)
    if (remaining === projects) return
    setProjects(remaining)
    if (view === `project:${name}`) go('inbox')
    setProject((current) => (current === name ? '' : current))
  }
  const open = () => {
    if (adding) {
      taskInput.current?.focus()
      return
    }
    dialogReturnFocus.current = document.activeElement as HTMLElement | null
    setProject(view.startsWith('project:') ? view.slice(8) : '')
    setProjectPickerOpen(false)
    setDatePickerOpen(false)
    setProjectSearch('')
    setDue(view === 'today' ? today() : '')
    setTime('')
    setRepeat('none')
    setLabelOpen(Boolean(label))
    setAdding(true)
  }
  const closeAddDialog = () => {
    setProjectPickerOpen(false)
    setDatePickerOpen(false)
    setAdding(false)
  }
  const chooseProject = (name: string) => {
    setProject(name)
    setProjectSearch('')
    setProjectPickerOpen(false)
    projectTrigger.current?.focus()
  }
  const createProjectFromTask = () => {
    const name = projectSearch.trim()
    if (!name || !canCreateProject) return
    setProjects((current) => [...current, name])
    chooseProject(name)
  }
  if (isLoading) return <LoadingPage />
  if (!isAuthenticated || !user) return null
  return (
    <div className="min-h-screen bg-app-background font-sans text-[#1f2937] transition-colors duration-250 dark:text-[#f3f4f6] motion-reduce:transition-none">
      <DashboardSidebar
        view={view}
        onViewChange={go}
        projects={projects}
        projectsWithTasks={new Set(tasks.map((task) => task.project))}
        onAddTask={open}
        onAddProject={() => setAddProject(true)}
        onTryPro={() => setUpgradeOpen(true)}
        onDeleteProject={deleteProject}
        isMobileOpen={mobile}
        onCloseMobile={() => setMobile(false)}
        isCollapsed={collapsed}
      />
      <div
        className={`fixed top-4 z-[35] flex items-center gap-2 max-[900px]:right-4 max-[900px]:left-auto ${
          collapsed ? 'left-[76px]' : 'left-[298px]'
        }`}
      >
        <button
          className={dashboardIconButtonClass}
          aria-label="Notifications"
          onClick={() => go('notifications')}
        >
          <Bell size={19} />
        </button>
        <button
          className={`${dashboardIconButtonClass} max-[900px]:hidden`}
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((x) => !x)}
        >
          {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
        </button>
      </div>
      <main
        className={`min-h-screen bg-app-background transition-[margin] duration-200 max-[900px]:ml-0 motion-reduce:transition-none ${
          collapsed ? 'ml-16' : 'ml-[286px]'
        }`}
      >
        <div className="mx-auto max-w-[920px] px-10 py-16 max-[900px]:px-[18px] max-[900px]:py-6">
          <header className="mb-[30px] flex items-center justify-between max-[900px]:mb-6 max-[900px]:justify-start max-[900px]:gap-3 max-[900px]:pr-10">
            <button
              className={`${dashboardIconButtonClass} hidden max-[900px]:grid`}
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <h1 className="m-0 min-w-0 truncate font-display text-[30px] font-semibold tracking-[-0.03em] max-[900px]:text-[26px]">
              {heading}
            </h1>
          </header>
          {adding && (
            <form
              aria-label="Add task"
              className="relative z-20 mb-8 rounded-2xl border border-[#d9dee7] bg-white p-[15px] text-[#1f2937] shadow-[0_12px_32px_#0002] dark:border-[#424242] dark:bg-[#292929] dark:text-[#f2f2f2] max-[620px]:p-3"
              onSubmit={(event) => {
                event.preventDefault()
                add()
              }}
            >
              <input
                ref={taskInput}
                autoFocus
                required
                className="mb-3 box-border w-full border-0 bg-transparent px-0 py-1 text-[19px] leading-7 text-[#1f2937] outline-none placeholder:text-[#667085] focus:shadow-none dark:text-[#f5f5f5] dark:placeholder:text-[#aaa]"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="What needs doing?"
                aria-label="Task title"
              />
              <div className="flex flex-wrap items-center gap-[6px]">
                <button
                  type="button"
                  className="grid size-[35px] cursor-pointer place-items-center rounded-lg border-0 bg-[#f4f1e9] text-[#27352f] hover:bg-[#e9e5da] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:bg-[#484848] dark:text-[#dedede] dark:hover:bg-[#555] dark:focus-visible:outline-[#fed7aa]"
                  aria-label="More task options"
                  aria-expanded={labelOpen}
                  onClick={() => setLabelOpen((open) => !open)}
                >
                  <Plus size={20} aria-hidden="true" />
                </button>
                <div ref={projectPicker} className="relative">
                  <button
                    ref={projectTrigger}
                    type="button"
                    className="flex min-h-[35px] max-w-[160px] cursor-pointer items-center gap-[7px] rounded-lg border border-[#d9dee7] bg-transparent px-[10px] text-sm text-[#1f2937] hover:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-[#484848] dark:text-[#f2f2f2] dark:hover:bg-[#383838] dark:focus-visible:outline-[#fed7aa]"
                    aria-label={`Project: ${project || 'Inbox'}`}
                    aria-haspopup="listbox"
                    aria-expanded={projectPickerOpen}
                    aria-controls="task-project-options"
                    onClick={() => {
                      setDatePickerOpen(false)
                      setProjectSearch('')
                      setProjectPickerOpen((open) => !open)
                    }}
                  >
                    <Inbox size={16} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{project || 'Inbox'}</span>
                  </button>
                  {projectPickerOpen && (
                    <div className="absolute left-[-96px] top-[calc(100%+7px)] z-30 w-[calc(100vw-40px)] max-w-[376px] overflow-hidden rounded-xl border border-[#d9dee7] bg-white p-[10px] text-[#1f2937] shadow-[0_16px_36px_#0002] dark:border-[#454545] dark:bg-[#292929] dark:text-[#f2f2f2] dark:shadow-[0_16px_36px_#0007] max-[620px]:left-[-42px]">
                      <input
                        ref={projectSearchInput}
                        className="box-border h-10 w-full rounded-lg border border-[#d9dee7] bg-transparent px-3 text-[15px] text-[#1f2937] outline-none placeholder:text-[#667085] focus:border-orange-500 dark:border-[#5d5d5d] dark:text-[#f2f2f2] dark:placeholder:text-[#aaa] dark:focus:border-[#a5a5a5]"
                        value={projectSearch}
                        onChange={(event) => setProjectSearch(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return
                          event.preventDefault()
                          if (inboxMatches) chooseProject('')
                          else if (projectMatches.length) chooseProject(projectMatches[0])
                          else createProjectFromTask()
                        }}
                        placeholder="Type a project name"
                        aria-label="Search projects"
                        aria-controls="task-project-options"
                      />
                      <div
                        id="task-project-options"
                        role="listbox"
                        aria-label="Projects"
                        className="mt-[10px] max-h-56 overflow-y-auto"
                      >
                        {inboxMatches && (
                          <button
                            type="button"
                            role="option"
                            aria-selected={!project}
                            className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left text-sm text-[#1f2937] hover:bg-[#f4f1e9] focus-visible:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-orange-500 aria-selected:bg-[#f4f1e9] dark:text-[#f2f2f2] dark:hover:bg-[#393939] dark:focus-visible:bg-[#393939] dark:focus-visible:outline-[#fed7aa] dark:aria-selected:bg-[#393939]"
                            onClick={() => chooseProject('')}
                          >
                            <Inbox
                              size={18}
                              aria-hidden="true"
                              className="text-[#667085] dark:text-[#d0d0d0]"
                            />
                            <span className="flex-1">Inbox</span>
                            {!project && <Check size={16} aria-hidden="true" />}
                          </button>
                        )}
                        {projectMatches.map((name) => (
                          <button
                            key={name}
                            type="button"
                            role="option"
                            aria-selected={project === name}
                            className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left text-sm text-[#1f2937] hover:bg-[#f4f1e9] focus-visible:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-orange-500 aria-selected:bg-[#f4f1e9] dark:text-[#f2f2f2] dark:hover:bg-[#393939] dark:focus-visible:bg-[#393939] dark:focus-visible:outline-[#fed7aa] dark:aria-selected:bg-[#393939]"
                            onClick={() => chooseProject(name)}
                          >
                            <Inbox
                              size={18}
                              aria-hidden="true"
                              className="text-[#667085] dark:text-[#d0d0d0]"
                            />
                            <span className="min-w-0 flex-1 truncate">{name}</span>
                            {project === name && <Check size={16} aria-hidden="true" />}
                          </button>
                        ))}
                        {canCreateProject && (
                          <button
                            type="button"
                            className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left text-sm text-[#1f2937] hover:bg-[#f4f1e9] focus-visible:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-orange-500 dark:text-[#f2f2f2] dark:hover:bg-[#393939] dark:focus-visible:bg-[#393939] dark:focus-visible:outline-[#fed7aa]"
                            onClick={createProjectFromTask}
                          >
                            <Plus size={18} aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate">
                              Create “{projectSearch.trim()}”
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div ref={datePicker} className="relative">
                  <button
                    ref={dateTrigger}
                    type="button"
                    className="flex min-h-[35px] cursor-pointer items-center gap-[7px] rounded-lg border border-[#d9dee7] bg-transparent px-[10px] text-sm text-[#1f2937] hover:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-[#484848] dark:text-[#f2f2f2] dark:hover:bg-[#383838] dark:focus-visible:outline-[#fed7aa]"
                    aria-label={`Date: ${due || 'None'}`}
                    aria-haspopup="dialog"
                    aria-expanded={datePickerOpen}
                    onClick={() => {
                      setProjectPickerOpen(false)
                      setDatePickerOpen((open) => !open)
                    }}
                  >
                    <CalendarDays size={16} aria-hidden="true" />
                    <span>{due ? dl(due) : 'Date'}</span>
                  </button>
                  {datePickerOpen && (
                    <TaskDatePicker
                      due={due}
                      time={time}
                      repeat={repeat}
                      onSelect={(date) => {
                        setDue(date)
                        setDatePickerOpen(false)
                        dateTrigger.current?.focus()
                      }}
                      onTimeChange={(value) => {
                        if (!due) setDue(today())
                        setTime(value)
                      }}
                      onRepeatChange={(value) => {
                        if (!due && value !== 'none') setDue(today())
                        setRepeat(value)
                      }}
                    />
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="grid size-[35px] cursor-pointer place-items-center border-0 bg-transparent text-[#667085] hover:text-[#1f2937] focus-visible:outline-2 focus-visible:outline-orange-500 dark:text-[#ccc] dark:hover:text-white dark:focus-visible:outline-[#fed7aa]"
                    aria-label="Cancel task"
                    onClick={closeAddDialog}
                  >
                    <X size={22} aria-hidden="true" strokeWidth={1.5} />
                  </button>
                  <button
                    type="submit"
                    className="grid size-10 cursor-pointer place-items-center rounded-xl border-0 btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Add task"
                    disabled={!draft.trim()}
                  >
                    <Send size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {labelOpen && (
                <label className="mt-3 flex items-center gap-2 border-t border-[#d9dee7] pt-3 text-sm text-[#475467] dark:border-[#424242] dark:text-[#ccc]">
                  <SlidersHorizontal size={16} aria-hidden="true" /> Label
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent text-[#1f2937] outline-none placeholder:text-[#667085] dark:text-[#f2f2f2] dark:placeholder:text-[#aaa]"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="Optional"
                    aria-label="Task label"
                  />
                </label>
              )}
            </form>
          )}
          {view === 'search' && (
            <div className="mb-[26px] flex items-center gap-3 border-b border-[#d9dee7] py-3 text-[#667085] dark:border-[#383838] dark:text-[#a7b0bf]">
              <Search size={19} className="shrink-0" />
              <input
                ref={search}
                className="min-w-0 flex-1 border-0 bg-transparent text-base text-[#1f2937] outline-none placeholder:text-[#667085] dark:text-[#f3f4f6] dark:placeholder:text-[#a7b0bf]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your tasks"
                aria-label="Search tasks"
              />
            </div>
          )}
          {view === 'filters' && (
            <div className="mb-[25px] flex flex-wrap gap-2">
              <button
                className={`cursor-pointer rounded-full border px-[14px] py-[7px] ${
                  !filter
                    ? 'btn-primary border-[#c2410c] dark:border-[#fed7aa]'
                    : 'border-[#d9dee7] bg-white text-[#1f2937] dark:border-[#383838] dark:bg-[#262626] dark:text-[#f3f4f6]'
                }`}
                onClick={() => setFilter('')}
              >
                All labels
              </button>
              {labels.map((x) => (
                <button
                  key={x}
                  className={`cursor-pointer rounded-full border px-[14px] py-[7px] ${
                    filter === x
                      ? 'btn-primary border-[#c2410c] dark:border-[#fed7aa]'
                      : 'border-[#d9dee7] bg-white text-[#1f2937] dark:border-[#383838] dark:bg-[#262626] dark:text-[#f3f4f6]'
                  }`}
                  onClick={() => setFilter(x)}
                >
                  {x}
                </button>
              ))}
            </div>
          )}
          {view === 'reporting' ? (
            <Report tasks={tasks} />
          ) : view === 'help' ? (
            <div className="mt-20 max-w-[520px]">
              <h2 className="font-display text-[25px] font-semibold">
                Make a little room for what matters
              </h2>
              <p className="text-[15px] leading-[1.6] text-[#667085] dark:text-[#a7b0bf]">
                Add a task to Inbox, set a date to see it in Today or Upcoming, and group related
                work in a project.
              </p>
              <button className={dashboardPrimaryClass} onClick={open}>
                <Plus size={17} /> Add task
              </button>
            </div>
          ) : (
            <>
              {view === 'upcoming' ? (
                <UpcomingCalendarFocus
                  tasks={visible}
                  month={calendarMonth}
                  selectedDate={selectedDate}
                  onMonthChange={changeUpcomingMonth}
                  onSelectDate={setSelectedDate}
                  onJumpToDate={(date) => {
                    const selected = new Date(`${date}T12:00:00`)
                    setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
                    setSelectedDate(date)
                  }}
                  onAdd={(date) => {
                    open()
                    setDue(date)
                  }}
                  onComplete={(task) =>
                    setTasks((current) =>
                      current.map((item) =>
                        item.id === task.id
                          ? item.repeat && item.repeat !== 'none' && item.due && !item.done
                            ? { ...item, due: nextRepeatDate(item.due, item.repeat) }
                            : { ...item, done: !item.done }
                          : item,
                      ),
                    )
                  }
                  onDelete={(task) =>
                    setTasks((current) => current.filter((item) => item.id !== task.id))
                  }
                />
              ) : visible.length ? (
                <div className="border-t border-[#d9dee7] dark:border-[#383838]">
                  {visible.map((t) => (
                    <div
                      className="group flex min-h-14 items-center gap-3 border-b border-[#d9dee7] dark:border-[#383838]"
                      key={t.id}
                    >
                      <button
                        className={`grid size-5 shrink-0 cursor-pointer place-items-center rounded-full border ${
                          t.done
                            ? 'border-[#c2410c] bg-[#c2410c] text-white dark:border-[#fed7aa] dark:bg-[#fed7aa] dark:text-[#1f2937]'
                            : 'border-[#667085] bg-transparent text-white'
                        }`}
                        aria-label={`Complete ${t.title}`}
                        onClick={() =>
                          setTasks((x) =>
                            x.map((y) =>
                              y.id === t.id
                                ? y.repeat && y.repeat !== 'none' && y.due && !y.done
                                  ? { ...y, due: nextRepeatDate(y.due, y.repeat) }
                                  : { ...y, done: !y.done }
                                : y,
                            ),
                          )
                        }
                      >
                        {t.done && <Check size={13} />}
                      </button>
                      <div className="grid flex-1 gap-[5px]">
                        <span
                          className={`text-sm ${
                            t.done ? 'text-[#667085] line-through dark:text-[#a7b0bf]' : ''
                          }`}
                        >
                          {t.title}
                        </span>
                        <small className="text-[11px] text-[#667085] dark:text-[#a7b0bf]">
                          {[
                            t.due && dl(t.due),
                            t.time,
                            t.repeat && t.repeat !== 'none' && `Repeats ${t.repeat}`,
                            t.project,
                            t.label,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </small>
                      </div>
                      <button
                        className={`${dashboardIconButtonClass} text-[#667085] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 dark:text-[#a7b0bf]`}
                        aria-label={`Delete ${t.title}`}
                        onClick={() => setTasks((x) => x.filter((y) => y.id !== t.id))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="flex cursor-pointer items-center gap-2 border-0 bg-transparent py-[13px] text-sm font-medium uppercase tracking-[0.05em] text-orange-600 dark:text-orange-400"
                    onClick={open}
                  >
                    <Plus size={18} /> Add task
                  </button>
                </div>
              ) : adding ? null : (
                <Empty view={view} onAdd={open} />
              )}
            </>
          )}
        </div>
      </main>
      {upgradeOpen && <UpgradeDialog onClose={() => setUpgradeOpen(false)} />}
      {addProject && (
        <Dialog title="Add project" onClose={() => setAddProject(false)} onSubmit={createProject}>
          <input
            autoFocus
            required
            className="box-border w-full rounded-none border-0 border-b border-[#424242] bg-transparent px-0 pb-[13px] pt-[7px] text-[19px] text-[#f5f5f5] outline-none placeholder:text-[#8d8d8d] focus:border-orange-400 focus:shadow-none"
            value={projectDraft}
            onChange={(e) => setProjectDraft(e.target.value)}
            placeholder="Project name"
            aria-label="Project name"
          />
        </Dialog>
      )}
    </div>
  )
}
function TaskDatePicker({
  due,
  time,
  repeat,
  onSelect,
  onTimeChange,
  onRepeatChange,
}: {
  due: string
  time: string
  repeat: NonNullable<Task['repeat']>
  onSelect: (date: string) => void
  onTimeChange: (time: string) => void
  onRepeatChange: (repeat: NonNullable<Task['repeat']>) => void
}) {
  const [search, setSearch] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [showTime, setShowTime] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const calendarScroll = useRef<HTMLDivElement>(null)
  const now = new Date()
  const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  useEffect(() => {
    if (monthOffset !== 0 || !calendarScroll.current) return
    const currentDay = calendarScroll.current.querySelector<HTMLElement>('[data-today="true"]')
    if (currentDay) {
      calendarScroll.current.scrollTop =
        currentDay.offsetTop - calendarScroll.current.offsetTop - 24
    }
  }, [monthOffset])
  const day = now.getDay()
  const shortcuts = [
    { name: 'Today', date: localDate(now), icon: CalendarDays, color: '#31ad69' },
    { name: 'Tomorrow', date: moveDate(now, 1), icon: Sun, color: '#f7ae32' },
    {
      name: 'This weekend',
      date: moveDate(now, (6 - day + 7) % 7),
      icon: CalendarDays,
      color: '#4b94f2',
    },
    {
      name: 'Next week',
      date: moveDate(now, (8 - day) % 7 || 7),
      icon: CalendarDays,
      color: '#a06cf2',
    },
  ]
  const submitSearch = () => {
    const value = search.trim().toLowerCase()
    const shortcut = shortcuts.find((item) => item.name.toLowerCase() === value)
    if (shortcut) {
      onSelect(shortcut.date)
      return
    }
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''
    const date = normalized ? new Date(`${normalized}T12:00:00`) : null
    if (date && !Number.isNaN(date.valueOf()) && localDate(date) === normalized) {
      onSelect(normalized)
      return
    }
    setInvalid(true)
  }
  return (
    <div
      role="dialog"
      aria-label="Choose a date"
      className="absolute left-0 top-[calc(100%+7px)] z-30 flex max-h-[min(660px,calc(100vh-270px))] w-[min(312px,calc(100vw-40px))] flex-col overflow-y-auto rounded-xl border border-[#d9dee7] bg-white text-[#1f2937] shadow-[0_16px_36px_#0002] dark:border-[#454545] dark:bg-[#292929] dark:text-[#f2f2f2] dark:shadow-[0_16px_36px_#0007] max-[620px]:left-[-145px]"
    >
      <div className="border-b border-[#d9dee7] p-3 dark:border-[#424242]">
        <input
          autoFocus
          className="w-full border-0 bg-transparent text-[15px] text-[#1f2937] outline-none placeholder:text-[#667085] dark:text-[#f2f2f2] dark:placeholder:text-[#aaa]"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setInvalid(false)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submitSearch()
            }
          }}
          placeholder="Type a date"
          aria-label="Type a date"
          aria-invalid={invalid}
        />
        {invalid && (
          <p className="mb-0 mt-2 text-xs text-[#b42318] dark:text-[#f4a4ab]">
            Use today, tomorrow, or YYYY-MM-DD.
          </p>
        )}
      </div>
      <div className="border-b border-[#d9dee7] p-2 dark:border-[#424242]">
        {shortcuts.map(({ name, date, icon: Icon, color }) => (
          <button
            key={name}
            type="button"
            className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left text-sm text-[#1f2937] hover:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-orange-500 dark:text-[#f2f2f2] dark:hover:bg-[#383838] dark:focus-visible:outline-[#fed7aa]"
            onClick={() => onSelect(date)}
          >
            <Icon size={20} aria-hidden="true" style={{ color }} />
            <strong className="flex-1 font-semibold">{name}</strong>
            <span className="text-[#667085] dark:text-[#c9c9c9]">
              {new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
                weekday: name === 'Next week' ? undefined : 'short',
                month: name === 'Next week' ? 'short' : undefined,
                day: name === 'Next week' ? 'numeric' : undefined,
              })}
            </span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <strong className="text-sm">
          {month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </strong>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid size-7 cursor-pointer place-items-center border-0 bg-transparent text-[#667085] hover:text-[#1f2937] dark:text-[#bbb] dark:hover:text-white"
            aria-label="Previous month"
            onClick={() => setMonthOffset((value) => value - 1)}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            className="grid size-7 cursor-pointer place-items-center border-0 bg-transparent text-[#667085] hover:text-[#1f2937] dark:text-[#bbb] dark:hover:text-white"
            aria-label="Current month"
            onClick={() => setMonthOffset(0)}
          >
            <span className="size-2 rounded-full border border-current" />
          </button>
          <button
            type="button"
            className="grid size-7 cursor-pointer place-items-center border-0 bg-transparent text-[#667085] hover:text-[#1f2937] dark:text-[#bbb] dark:hover:text-white"
            aria-label="Next month"
            onClick={() => setMonthOffset((value) => value + 1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div ref={calendarScroll} className="min-h-0 max-h-[240px] overflow-y-auto px-3 pb-2">
        <TaskDateMonth month={month} due={due} onSelect={onSelect} />
        <TaskDateMonth
          month={new Date(month.getFullYear(), month.getMonth() + 1, 1)}
          due={due}
          onSelect={onSelect}
          compact
        />
      </div>
      <div className="grid gap-2 border-t border-[#d9dee7] p-3 dark:border-[#424242]">
        <button
          type="button"
          className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#d9dee7] bg-transparent text-sm font-semibold text-[#475467] hover:bg-[#f4f1e9] dark:border-[#454545] dark:text-[#dedede] dark:hover:bg-[#383838]"
          aria-expanded={showTime}
          onClick={() => setShowTime((open) => !open)}
        >
          <Clock3 size={16} />
          {time || 'Time'}
        </button>
        {showTime && (
          <input
            type="time"
            className="min-h-10 rounded-lg border border-[#d9dee7] bg-white px-3 text-[#1f2937] scheme-light dark:border-[#555] dark:bg-[#292929] dark:text-[#f2f2f2] dark:scheme-dark"
            aria-label="Task time"
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
          />
        )}
        <button
          type="button"
          className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#d9dee7] bg-transparent text-sm font-semibold text-[#475467] hover:bg-[#f4f1e9] dark:border-[#454545] dark:text-[#dedede] dark:hover:bg-[#383838]"
          aria-expanded={showRepeat}
          onClick={() => setShowRepeat((open) => !open)}
        >
          <Repeat2 size={16} />
          {repeat === 'none' ? 'Repeat' : `Repeat ${repeat}`}
        </button>
        {showRepeat && (
          <select
            className="min-h-10 rounded-lg border border-[#d9dee7] bg-white px-3 text-[#1f2937] scheme-light dark:border-[#555] dark:bg-[#292929] dark:text-[#f2f2f2] dark:scheme-dark"
            aria-label="Repeat task"
            value={repeat}
            onChange={(event) => onRepeatChange(event.target.value as NonNullable<Task['repeat']>)}
          >
            <option value="none">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        )}
      </div>
    </div>
  )
}
function TaskDateMonth({
  month,
  due,
  onSelect,
  compact = false,
}: {
  month: Date
  due: string
  onSelect: (date: string) => void
  compact?: boolean
}) {
  const first = (month.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  return (
    <div className={compact ? 'mt-3' : ''}>
      {compact && (
        <strong className="mb-2 block border-b border-[#d9dee7] pb-2 text-sm dark:border-[#424242]">
          {month.toLocaleDateString('en-US', { month: 'short' })}
        </strong>
      )}
      <div className="sticky top-0 z-10 grid grid-cols-7 bg-white text-center text-xs text-[#667085] dark:bg-[#292929] dark:text-[#c4c4c4]">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((name, index) => (
          <span key={`${name}${index}`} className="py-1">
            {name}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {Array.from({ length: first }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const date = localDate(new Date(month.getFullYear(), month.getMonth(), index + 1))
          return (
            <button
              key={date}
              type="button"
              aria-label={new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
                dateStyle: 'full',
              })}
              aria-pressed={due === date}
              data-today={date === today()}
              className={`mx-auto grid size-8 cursor-pointer place-items-center rounded-full border-0 text-sm hover:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-orange-500 dark:hover:bg-[#444] dark:focus-visible:outline-[#fed7aa] ${due === date ? 'bg-[#c2410c] text-white hover:bg-[#c2410c] dark:bg-[#fed7aa] dark:text-[#1f2937] dark:hover:bg-[#fed7aa]' : date === today() ? 'text-[#c2410c] dark:text-[#fdba74]' : 'bg-transparent text-[#1f2937] dark:text-[#f2f2f2]'}`}
              onClick={() => onSelect(date)}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
function Empty({ view, onAdd }: { view: DashboardView; onAdd: () => void }) {
  const c =
    view === 'inbox'
      ? [
          'Capture now, plan later',
          'Inbox is your go-to spot for quick task entry. Clear your mind now, organize when you’re ready.',
        ]
      : view === 'today'
        ? ['A clear day ahead', 'Tasks scheduled for today will appear here.']
        : view === 'upcoming'
          ? ['Nothing on the horizon', 'Give a task a date to see it here.']
          : view === 'notifications'
            ? ['All caught up', 'You have no notifications right now.']
            : ['Keep things easy to find', 'Add a task to this view to get started.']
  return (
    <div className="mx-auto mt-[18vh] max-w-[360px] text-center max-[900px]:mt-[12vh]">
      <div className="relative mb-[14px] grid h-[150px] place-items-center text-[#fed7aa] max-[900px]:h-[132px]">
        {view === 'inbox' ? (
          <img
            className="h-[150px] w-[150px] object-contain max-[900px]:h-[132px] max-[900px]:w-[132px]"
            src="/inbox-empty.png"
            alt=""
          />
        ) : view === 'today' ? (
          <img
            className="h-[150px] w-[150px] object-contain max-[900px]:h-[132px] max-[900px]:w-[132px]"
            src="/today-empty.png"
            alt=""
          />
        ) : (
          <img
            className="h-[150px] w-[150px] object-contain max-[900px]:h-[132px] max-[900px]:w-[132px]"
            src="/inbox-empty.png"
            alt=""
          />
        )}
      </div>
      <h2 className="m-0 mb-[9px] font-display text-lg font-semibold">{c[0]}</h2>
      <p className="mx-auto mb-[18px] max-w-[300px] text-[15px] leading-[1.5] text-[#667085] dark:text-[#a7b0bf]">
        {c[1]}
      </p>
      {view !== 'notifications' && (
        <button className={dashboardPrimaryClass} onClick={onAdd}>
          <Plus size={20} /> Add task
        </button>
      )}
    </div>
  )
}
function Report({ tasks }: { tasks: Task[] }) {
  const done = tasks.filter((x) => x.done).length
  return (
    <div className="max-w-[600px]">
      <p className="text-[15px] text-[#667085] dark:text-[#a7b0bf]">Your activity</p>
      <div className="my-5 grid grid-cols-3 border-y border-[#d9dee7] dark:border-[#383838]">
        <div className="border-r border-[#d9dee7] px-4 py-6 last:border-r-0 dark:border-[#383838]">
          <strong className="block text-[32px] max-[900px]:text-[26px]">{tasks.length}</strong>
          <span className="mt-1.5 block text-[13px] text-[#667085] dark:text-[#a7b0bf]">
            Total tasks
          </span>
        </div>
        <div className="border-r border-[#d9dee7] px-4 py-6 last:border-r-0 dark:border-[#383838]">
          <strong className="block text-[32px] max-[900px]:text-[26px]">{done}</strong>
          <span className="mt-1.5 block text-[13px] text-[#667085] dark:text-[#a7b0bf]">
            Completed
          </span>
        </div>
        <div className="border-r border-[#d9dee7] px-4 py-6 last:border-r-0 dark:border-[#383838]">
          <strong className="block text-[32px] max-[900px]:text-[26px]">
            {tasks.length - done}
          </strong>
          <span className="mt-1.5 block text-[13px] text-[#667085] dark:text-[#a7b0bf]">Open</span>
        </div>
      </div>
      <p className="mt-1.5 text-[13px] text-[#667085] dark:text-[#a7b0bf]">
        Your task totals update as you add and complete work.
      </p>
    </div>
  )
}
function UpcomingCalendarFocus({
  tasks,
  month,
  selectedDate,
  onMonthChange,
  onSelectDate,
  onJumpToDate,
  onAdd,
  onComplete,
  onDelete,
}: {
  tasks: Task[]
  month: Date
  selectedDate: string
  onMonthChange: (direction: number) => void
  onSelectDate: (date: string) => void
  onJumpToDate: (date: string) => void
  onAdd: (date: string) => void
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const tomorrow = moveDate(new Date(), 1)
  const firstWeekday = (month.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const canGoPrevious = localDate(month).slice(0, 7) > tomorrow.slice(0, 7)
  const selected = new Date(`${selectedDate}T12:00:00`)
  const selectedTasks = tasks
    .filter((task) => task.due === selectedDate)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  const later = tasks
    .filter((task) => task.due > selectedDate)
    .sort((a, b) => a.due.localeCompare(b.due) || (a.time || '').localeCompare(b.time || ''))
  const taskCounts = new Map<string, number>()
  for (const task of tasks) taskCounts.set(task.due, (taskCounts.get(task.due) || 0) + 1)
  const selectedLabel = selected.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] items-start gap-5 max-[1100px]:grid-cols-1">
      <section
        aria-labelledby="upcoming-calendar-heading"
        className="min-w-0 rounded-xl border border-[#d9dee7] bg-white p-5 dark:border-[#414141] dark:bg-[#262626] max-[520px]:p-3"
      >
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              id="upcoming-calendar-heading"
              className="m-0 font-display text-[22px] font-semibold text-[#27352f] dark:text-[#f3f4f6]"
            >
              {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="mb-0 mt-1 text-sm text-[#59645e] dark:text-[#b6c0b8]">
              Select a day to see its tasks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`${dashboardIconButtonClass} border border-[#d9dee7] bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#484848] dark:bg-[#292929]`}
              aria-label="Previous month"
              disabled={!canGoPrevious}
              onClick={() => onMonthChange(-1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              className={`${dashboardIconButtonClass} border border-[#d9dee7] bg-white dark:border-[#484848] dark:bg-[#292929]`}
              aria-label="Next month"
              onClick={() => onMonthChange(1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-[#59645e] dark:text-[#b6c0b8] max-[520px]:gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <span key={day} className="py-1">
              {day}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, index) => (
            <span key={`blank-${index}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const date = new Date(month.getFullYear(), month.getMonth(), index + 1)
            const key = localDate(date)
            const count = taskCounts.get(key) || 0
            const isSelected = selectedDate === key
            const dayLabel = date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })
            return (
              <button
                key={key}
                type="button"
                disabled={key < tomorrow}
                aria-label={`${dayLabel}${count ? `, ${count} ${count === 1 ? 'task' : 'tasks'}` : ''}`}
                aria-pressed={isSelected}
                className={`flex min-h-[67px] min-w-0 cursor-pointer flex-col items-start rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-default disabled:opacity-35 dark:focus-visible:outline-orange-400 max-[520px]:min-h-[49px] max-[520px]:px-1.5 max-[520px]:py-1.5 motion-reduce:transition-none ${
                  isSelected
                    ? 'border-orange-500 bg-[#fff3e5] text-orange-700 dark:border-orange-400 dark:bg-orange-400/15 dark:text-orange-300'
                    : 'border-transparent bg-[#f7f6f2] text-[#27352f] hover:border-[#d9dee7] hover:bg-[#fff3e5] dark:bg-[#313131] dark:text-[#f3f4f6] dark:hover:border-[#595959] dark:hover:bg-orange-400/15'
                }`}
                onClick={() => onSelectDate(key)}
              >
                <span>{index + 1}</span>
                {count > 0 && (
                  <span
                    className="mt-auto flex items-center gap-1 pt-1 text-[10px] leading-none text-orange-700 dark:text-orange-300"
                    aria-hidden="true"
                  >
                    <span className="size-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
                    <span className="max-[520px]:sr-only">{count}</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section
        aria-labelledby="upcoming-selected-heading"
        className="min-w-0 rounded-xl border border-[#d9dee7] bg-white p-5 dark:border-[#414141] dark:bg-[#262626] max-[520px]:p-4"
      >
        <h2
          id="upcoming-selected-heading"
          className={`m-0 font-display text-xl font-semibold leading-tight text-[#27352f] dark:text-[#f3f4f6] ${
            selectedTasks.length ? '' : 'mb-5'
          }`}
        >
          {selectedLabel}
        </h2>
        {selectedTasks.length > 0 && (
          <p className="mb-5 mt-1 text-sm text-[#59645e] dark:text-[#b6c0b8]">
            {selectedTasks.length} {selectedTasks.length === 1 ? 'task' : 'tasks'} planned
          </p>
        )}
        <div className="grid gap-2">
          {selectedTasks.length ? (
            selectedTasks.map((task) => (
              <UpcomingTask key={task.id} task={task} onComplete={onComplete} onDelete={onDelete} />
            ))
          ) : (
            <p className="m-0 rounded-lg bg-[#f7f6f2] px-3 py-4 text-sm leading-6 text-[#59645e] dark:bg-[#313131] dark:text-[#b6c0b8]">
              Nothing planned here yet.
            </p>
          )}
        </div>
        <button
          className="mt-3 flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-[#fff3e5] px-3 text-left text-sm font-medium text-orange-700 hover:bg-[#fed7aa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:bg-orange-400/15 dark:text-orange-300 dark:hover:bg-orange-400/25 dark:focus-visible:outline-orange-400"
          aria-label={`Add task for ${selectedLabel}`}
          onClick={() => onAdd(selectedDate)}
        >
          <Plus size={17} aria-hidden="true" /> Add task for this day
        </button>

        <div className="mt-7 border-t border-[#d9dee7] pt-5 dark:border-[#414141]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="m-0 font-display text-base font-semibold text-[#27352f] dark:text-[#f3f4f6]">
              Coming up
            </h3>
            {later.length > 0 && (
              <span className="text-xs text-[#59645e] dark:text-[#b6c0b8]">
                {later.length} later
              </span>
            )}
          </div>
          {later.length ? (
            <div className="max-h-64 overflow-y-auto">
              {later.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="flex min-h-12 w-full cursor-pointer items-start gap-3 border-0 border-b border-[#e6e8e2] bg-transparent px-0 py-2.5 text-left hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-[#414141] dark:hover:text-orange-300 dark:focus-visible:outline-orange-400"
                  aria-label={`View ${task.title} on ${dl(task.due)}`}
                  onClick={() => onJumpToDate(task.due)}
                >
                  <span className="w-14 shrink-0 text-xs font-medium text-orange-700 dark:text-orange-300">
                    {dl(task.due)}
                  </span>
                  <span className="min-w-0 break-words text-sm text-[#27352f] dark:text-[#f3f4f6]">
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm leading-6 text-[#59645e] dark:text-[#b6c0b8]">
              No tasks planned after this day.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function UpcomingTask({
  task,
  onComplete,
  onDelete,
}: {
  task: Task
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const details = [
    task.time,
    task.project,
    task.label,
    task.repeat && task.repeat !== 'none' && `Repeats ${task.repeat}`,
  ].filter(Boolean)
  return (
    <div className="group flex min-w-0 items-start gap-3 rounded-lg bg-[#f7f6f2] p-3 dark:bg-[#313131]">
      <button
        className="mt-0.5 grid size-5 shrink-0 cursor-pointer place-items-center rounded-full border border-[#727b73] bg-transparent text-white hover:border-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-[#b6c0b8] dark:hover:border-orange-400 dark:focus-visible:outline-orange-400"
        aria-label={`Complete ${task.title}`}
        onClick={() => onComplete(task)}
      >
        <Check
          size={13}
          className="opacity-0 group-hover:opacity-50 group-focus-within:opacity-50"
          aria-hidden="true"
        />
      </button>
      <div className="min-w-0 flex-1">
        <p className="m-0 break-words text-sm font-medium leading-5 text-[#27352f] dark:text-[#f3f4f6]">
          {task.title}
        </p>
        {details.length > 0 && (
          <p className="mb-0 mt-1 text-xs leading-5 text-[#59645e] dark:text-[#b6c0b8]">
            {details.join(' · ')}
          </p>
        )}
      </div>
      <button
        className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[#59645e] hover:bg-[#fff3e5] hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-[#b6c0b8] dark:hover:bg-orange-400/15 dark:hover:text-orange-300 dark:focus-visible:outline-orange-400"
        aria-label={`Delete ${task.title}`}
        onClick={() => onDelete(task)}
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  )
}
function Dialog({
  title,
  onClose,
  onSubmit,
  children,
}: {
  title: string
  onClose: () => void
  onSubmit: () => void
  children: React.ReactNode
}) {
  const titleId = `dialog-title-${title.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-5 animate-dialog-fade-in motion-reduce:animate-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        className="w-full max-w-[667px] rounded-[13px] border border-[#414141] bg-[#292929] px-4 pb-[14px] pt-4 text-[#f2f2f2] shadow-[0_24px_70px_#0008] animate-dialog-slide-up max-[520px]:rounded-xl max-[520px]:p-[18px] motion-reduce:animate-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2
            id={titleId}
            className="m-0 font-sans text-base font-bold tracking-normal text-[#f5f5f5]"
          >
            {title}
          </h2>
          <button
            type="button"
            className={dashboardIconButtonClass}
            aria-label="Close"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        {children}
        <div className="mt-[14px] flex justify-end gap-[10px] border-t border-[#414141] pt-3 max-[520px]:mt-[18px]">
          <button
            className="cursor-pointer border-0 bg-transparent px-[14px] py-[10px] text-[#bcbcbc] hover:text-[#f2f2f2] hover:underline focus-visible:text-[#f2f2f2] focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`${dashboardPrimaryClass} min-w-[100px] px-[17px] py-[10px]`}
            type="submit"
          >
            {title}
          </button>
        </div>
      </form>
    </div>
  )
}
