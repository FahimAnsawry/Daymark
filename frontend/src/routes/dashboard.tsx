import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CornerDownLeft,
  FolderInput,
  Inbox,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Repeat2,
  Search,
  Send,
  SlidersHorizontal,
  Sun,
  Timer,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  DashboardSidebar,
  LINKABLE_VIEWS,
  type DashboardView,
} from '../components/DashboardSidebar'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { ConfirmCompleteDialog } from '../components/ConfirmCompleteDialog'
import { EditTaskDialog } from '../components/EditTaskDialog'
import { FocusPanel } from '../components/FocusPanel'
import { CalendarSettings } from '../components/CalendarSettings'
import { FocusView } from '../components/FocusView'
import { LoadingPage } from '../components/LoadingPage'
import { PlanLock } from '../components/PlanLock'
import { lockedSuffix } from '../lib/plans'
import { ReminderPicker } from '../components/ReminderPicker'
import { ReminderSettings } from '../components/ReminderSettings'
import { ShareProjectDialog } from '../components/ShareProjectDialog'
import { SharedProjectsView } from '../components/SharedProjectsView'
import { TaskReport } from '../components/TaskReport'
import { TodayCalendar } from '../components/TodayCalendar'
import { UpgradeDialog } from '../components/UpgradeDialog'
import { useAuth, usePlan } from '../lib/auth-context'
import { useBilling, useCancelTrial } from '../lib/billing'
import { reminderLabel, useReminderNotifications, type ReminderSetting } from '../lib/reminders'
import { assignablePeople, takePendingInvite, useProjectMembers } from '../lib/sharing'
import {
  localDate,
  taskKeys,
  useCompleteTask,
  useCreateProject,
  useCreateTask,
  useDeleteProject,
  useDeleteTask,
  useLocalTaskImport,
  useProjectRows,
  useProjects,
  useTasks,
  useUpdateTask,
  type ProjectRow,
  type Reminder,
  type Task,
} from '../lib/tasks'
/** The current view and Filters & Labels chip live in the URL, so a reload keeps them. */
/** `calendar` is how Google's consent screen reports back; it's shown once, then dropped. */
type DashboardSearch = {
  view?: DashboardView
  label?: string
  calendar?: 'connected' | 'error'
}
const URL_VIEWS = [...LINKABLE_VIEWS, 'search', 'notifications'] as const
export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    const view = typeof search.view === 'string' ? search.view : ''
    const label = typeof search.label === 'string' ? search.label.trim().slice(0, 255) : ''
    const isKnownView =
      (URL_VIEWS as readonly string[]).includes(view) ||
      (view.startsWith('project:') && view.length > 8)
    return {
      ...(isKnownView && { view: view as DashboardView }),
      ...(label && { label }),
      ...((search.calendar === 'connected' || search.calendar === 'error') && {
        calendar: search.calendar,
      }),
    }
  },
})
const today = () => new Date().toLocaleDateString('en-CA')
const moveDate = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return localDate(next)
}
const dashboardIconButtonClass =
  'grid size-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-[5px] text-[#1f2937] transition-colors duration-150 hover:bg-orange-500/15 hover:text-orange-500 focus-visible:bg-orange-500/15 focus-visible:text-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-[#f3f4f6] dark:hover:text-orange-400 dark:focus-visible:text-orange-400 dark:focus-visible:outline-orange-400 motion-reduce:transition-none'
const dashboardPrimaryClass =
  'inline-flex cursor-pointer items-center justify-center gap-[9px] rounded-full border-0 btn-primary px-[15px] py-[9px] text-sm font-medium uppercase tracking-[0.05em] transition-colors duration-150 motion-reduce:transition-none'
const sortChipClass =
  'inline-flex h-7 cursor-pointer items-center rounded-full border border-[#d9dee7] bg-transparent px-2.5 text-xs font-medium text-[#475467] transition-colors duration-150 hover:border-[#c2410c] hover:text-[#c2410c] focus-visible:border-[#c2410c] focus-visible:text-[#c2410c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-[#424242] dark:text-[#c9ced6] dark:hover:border-[#fed7aa] dark:hover:text-[#fed7aa] dark:focus-visible:border-[#fed7aa] dark:focus-visible:text-[#fed7aa] dark:focus-visible:outline-[#fed7aa] max-[620px]:hidden motion-reduce:transition-none'
const dl = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
/** Optimistically added tasks have a temporary negative id until the server responds. */
const isSaved = (task: Task) => task.id > 0
const NO_TASKS: Task[] = []
const NO_PROJECTS: string[] = []
function DashboardPage() {
  const nav = useNavigate()
  const searchParams = Route.useSearch()
  const navigateSearch = useNavigate({ from: Route.fullPath })
  const view = searchParams.view ?? 'inbox'
  const filter = searchParams.label ?? ''
  const calendarResult = searchParams.calendar
  useEffect(() => {
    if (!calendarResult) return
    if (calendarResult === 'connected') toast.success('Google Calendar is connected.')
    else toast.error('We couldn’t connect Google Calendar. Please try again.')
    void navigateSearch({
      search: (prev) => ({ ...prev, calendar: undefined }),
      replace: true,
    })
  }, [calendarResult, navigateSearch])
  const setView = (next: DashboardView) => {
    // Changing views closes any open sort menu and resets Inbox's "cleared" moment.
    setSorting(null)
    setSortedCount(0)
    void navigateSearch({ search: (prev) => ({ ...prev, view: next }), replace: true })
  }
  const setFilter = (next: string) =>
    void navigateSearch({
      search: (prev) => ({ ...prev, label: next || undefined }),
      replace: true,
    })
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { has } = usePlan()
  const hasPlus = has('plus')
  const hasPro = has('pro')
  const isImporting = useLocalTaskImport(user?.id)
  const canLoad = isAuthenticated && !isImporting
  const tasksQuery = useTasks(canLoad)
  const projectsQuery = useProjects(canLoad)
  const projectRowsQuery = useProjectRows(canLoad)
  const tasks = tasksQuery.data ?? NO_TASKS
  const projects = projectsQuery.data ?? NO_PROJECTS
  const createTaskMutation = useCreateTask()
  const completeTaskMutation = useCompleteTask()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()
  const createProjectMutation = useCreateProject()
  const deleteProjectMutation = useDeleteProject()
  const billingQuery = useBilling()
  const cancelTrialMutation = useCancelTrial()
  const isTrial = Boolean(
    billingQuery.data?.on_trial ||
    (user?.plan &&
      user.plan !== 'free' &&
      (billingQuery.data?.status === 'trialing' || billingQuery.data?.status === 'canceled')),
  )
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [adding, setAdding] = useState(false),
    [addProject, setAddProject] = useState(false),
    [upgradeOpen, setUpgradeOpen] = useState(false),
    [editingTask, setEditingTask] = useState<Task | null>(null),
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
    [reminder, setReminder] = useState<ReminderSetting>(null),
    [taskType, setTaskType] = useState<'normal' | 'reminder'>('normal'),
    [focusTask, setFocusTask] = useState<Task | null>(null),
    [shareTarget, setShareTarget] = useState<ProjectRow | null>(null),
    [query, setQuery] = useState(''),
    [quickDraft, setQuickDraft] = useState(''),
    [sorting, setSorting] = useState<{ taskId: number; kind: 'date' | 'project' } | null>(null),
    [sortedCount, setSortedCount] = useState(0),
    [calendarMonth, setCalendarMonth] = useState(() => {
      const next = new Date()
      next.setDate(next.getDate() + 1)
      return new Date(next.getFullYear(), next.getMonth(), 1)
    }),
    [selectedDate, setSelectedDate] = useState(() => moveDate(new Date(), 1)),
    [deleteTarget, setDeleteTarget] = useState<
      | { type: 'task'; task: Task }
      | { type: 'project'; projectName: string; taskCount: number }
      | null
    >(null),
    [completeTarget, setCompleteTarget] = useState<Task | null>(null)
  const search = useRef<HTMLInputElement>(null)
  const projectTrigger = useRef<HTMLButtonElement>(null)
  const dateTrigger = useRef<HTMLButtonElement>(null)
  const projectSearchInput = useRef<HTMLInputElement>(null)
  const projectPicker = useRef<HTMLDivElement>(null)
  const datePicker = useRef<HTMLDivElement>(null)
  const taskInput = useRef<HTMLInputElement>(null)
  const quickAddInput = useRef<HTMLInputElement>(null)
  const sortMenu = useRef<HTMLDivElement>(null)
  const dialogReturnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) void nav({ to: '/login' })
  }, [isLoading, isAuthenticated, nav])
  // An invitation opened while signed out is picked back up after signing in.
  useEffect(() => {
    if (!isAuthenticated) return
    const pendingInvite = takePendingInvite()
    if (pendingInvite) void nav({ to: '/invite/$token', params: { token: pendingInvite } })
  }, [isAuthenticated, nav])
  useReminderNotifications(tasks, hasPlus, (task) => {
    void queryClient.invalidateQueries({ queryKey: taskKeys.tasks })
    void queryClient.invalidateQueries({ queryKey: taskKeys.reports })
    toast.success(`Reminder completed: ${task.title}`)
  })
  const projectRows = projectRowsQuery.data
  const currentProject = view.startsWith('project:')
    ? projectRows?.find((row) => row.name === view.slice(8))
    : undefined
  // Only owners invite, and inviting is Pro; members of a shared project are never locked out.
  const shareLocked = currentProject?.is_owner !== false && !hasPro
  const isSharedProject = (row: { is_owner?: boolean; members_count?: number } | undefined) =>
    !!row && (row.is_owner === false || (row.members_count ?? 0) > 0)
  const currentMembers = useProjectMembers(
    currentProject && isSharedProject(currentProject) ? currentProject.id : null,
  )
  const assignees = assignablePeople(currentMembers.data)
  useEffect(() => {
    // A bookmarked or reloaded URL can point to a project that has since been deleted.
    if (
      view.startsWith('project:') &&
      projectsQuery.isSuccess &&
      !createProjectMutation.isPending &&
      !projects.includes(view.slice(8))
    )
      void navigateSearch({ search: (prev) => ({ ...prev, view: 'inbox' }), replace: true })
  }, [view, projects, projectsQuery.isSuccess, createProjectMutation.isPending, navigateSearch])
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
    if (!sorting) return
    const onPointerDown = (event: PointerEvent) => {
      if (!sortMenu.current?.contains(event.target as Node)) setSorting(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setSorting(null)
      sortMenu.current?.querySelector<HTMLButtonElement>('[data-sort-trigger]')?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [sorting])
  useEffect(() => {
    if (!adding) {
      dialogReturnFocus.current?.focus()
      dialogReturnFocus.current = null
    }
  }, [adding])
  const isTaskDone = (t: Task) =>
    t.done || Boolean(t.completed_at && t.completed_at.slice(0, 10) === today())

  const visible = useMemo(
    () =>
      tasks.filter((t) =>
        view === 'inbox'
          ? !isTaskDone(t) && !t.due && !t.project
          : view === 'today'
            ? t.due === today() ||
              (isTaskDone(t) && Boolean(t.completed_at && t.completed_at.slice(0, 10) === today()))
            : view === 'upcoming'
              ? !isTaskDone(t) && !!t.due && t.due > today()
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

  const todayActiveTasks = useMemo(
    () => (view === 'today' ? visible.filter((t) => !isTaskDone(t)) : visible),
    [visible, view],
  )

  const todayCompletedTasks = useMemo(
    () => (view === 'today' ? visible.filter((t) => isTaskDone(t)) : []),
    [visible, view],
  )
  const labels = [...new Set(tasks.map((t) => t.label).filter(Boolean))]
  const projectMatches = projects.filter((name) =>
    name.toLowerCase().includes(projectSearch.trim().toLowerCase()),
  )
  const noProjectMatches = 'no project'.includes(projectSearch.trim().toLowerCase())
  const canCreateProject =
    !!projectSearch.trim() &&
    !projects.some((name) => name.toLowerCase() === projectSearch.trim().toLowerCase()) &&
    !['inbox', 'no project'].includes(projectSearch.trim().toLowerCase())
  const heading = view.startsWith('project:')
    ? view.slice(8)
    : (
        {
          inbox: 'Inbox',
          today: 'Today',
          upcoming: 'Upcoming',
          filters: 'Filters & Labels',
          reporting: 'Reporting',
          focus: 'Focus sessions',
          shared: 'Shared projects',
          reminders: 'Reminders',
          calendar: 'Calendar',
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
    createTaskMutation.mutate({
      title: draft.trim(),
      due,
      project,
      label,
      time,
      repeat,
      ...(reminder &&
        due &&
        hasPlus && {
          reminder: reminder.reminder,
          reminder_early: reminder.early,
          reminder_frequency: reminder.frequency,
        }),
    })
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
    setReminder(null)
    setTaskType('normal')
    setAdding(false)
  }
  const createProject = () => {
    if (!projectDraft.trim()) return
    const n = projectDraft.trim()
    if (!projects.includes(n)) createProjectMutation.mutate(n)
    go(`project:${n}`)
    setProjectDraft('')
    setAddProject(false)
  }
  const handleDeleteProjectClick = (name: string) => {
    const taskCount = tasks.filter((t) => t.project === name).length
    setDeleteTarget({ type: 'project', projectName: name, taskCount })
  }
  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'task') {
      if (isSaved(deleteTarget.task)) deleteTaskMutation.mutate(deleteTarget.task)
    } else if (deleteTarget.type === 'project') {
      const { projectName } = deleteTarget
      deleteProjectMutation.mutate(projectName)
      if (view === `project:${projectName}`) go('inbox')
      setProject((current) => (current === projectName ? '' : current))
    }
    setDeleteTarget(null)
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
    setReminder(null)
    setTaskType('normal')
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
    createProjectMutation.mutate(name)
    chooseProject(name)
  }
  const completeTask = (task: Task) => {
    if (task.reminder) return
    if (isTaskDone(task)) {
      if (isSaved(task)) completeTaskMutation.mutate(task)
      return
    }
    setCompleteTarget(task)
  }
  const confirmComplete = () => {
    if (!completeTarget) return
    if (isSaved(completeTarget)) completeTaskMutation.mutate(completeTarget)
    setCompleteTarget(null)
  }
  const quickAdd = () => {
    const title = quickDraft.trim()
    if (!title) return
    createTaskMutation.mutate({ title, due: '', project: '', label: '', time: '', repeat: 'none' })
    setQuickDraft('')
  }
  /** Gives a task a date or project, which moves it out of Inbox, and offers a way back. */
  const sortTask = (task: Task, changes: { due: string } | { project: string }) => {
    const index = visible.findIndex((item) => item.id === task.id)
    const neighbour = visible[index + 1] ?? visible[index - 1]
    const message =
      'project' in changes
        ? `Moved to ${changes.project}`
        : changes.due === today()
          ? 'Moved to Today'
          : changes.due === moveDate(new Date(), 1)
            ? 'Moved to Tomorrow'
            : `Scheduled for ${dl(changes.due)}`
    updateTaskMutation.mutate({ task, changes })
    setSorting(null)
    setSortedCount((count) => count + 1)
    // Keep keyboard focus in the list instead of losing it with the row that just left.
    requestAnimationFrame(() => {
      const next = neighbour
        ? document.querySelector<HTMLButtonElement>(`[data-task-id="${neighbour.id}"] button`)
        : null
      ;(next ?? quickAddInput.current)?.focus()
    })
    toast(
      (shown) => (
        <span className="flex items-center gap-4 text-sm">
          <span>{message}</span>
          <button
            type="button"
            className="cursor-pointer rounded-full border-0 bg-transparent px-2 py-1 text-sm font-semibold text-[#c2410c] hover:bg-orange-500/10 focus-visible:outline-2 focus-visible:outline-orange-500"
            onClick={() => {
              updateTaskMutation.mutate({
                task: { ...task, ...changes },
                changes: 'project' in changes ? { project: '' } : { due: '' },
              })
              setSortedCount((count) => Math.max(0, count - 1))
              toast.dismiss(shown.id)
            }}
          >
            Undo
          </button>
        </span>
      ),
      { id: `sorted-${task.id}`, duration: 6000 },
    )
  }
  if (isLoading || isImporting || (canLoad && (tasksQuery.isPending || projectsQuery.isPending)))
    return <LoadingPage />
  if (!isAuthenticated || !user) return null

  const renderTaskRow = (t: Task) => {
    const done = isTaskDone(t)
    const isReminder = Boolean(t.reminder)
    return (
      <div
        className="group flex min-h-14 items-center gap-3 border-b border-[#d9dee7] dark:border-[#383838]"
        key={t.id}
        data-task-id={t.id}
      >
        {isReminder ? (
          <div
            className={`grid size-5 shrink-0 place-items-center ${
              done
                ? 'rounded-full border border-[#c2410c] bg-[#c2410c] text-white dark:border-[#fed7aa] dark:bg-[#fed7aa] dark:text-[#1f2937]'
                : 'text-orange-600 dark:text-orange-400'
            }`}
            title={
              done
                ? 'Completed'
                : `Reminder: ${reminderLabel(t.reminder, t.reminder_frequency, t.reminder_early) || 'Scheduled'}`
            }
            aria-label={
              done
                ? `Completed reminder: ${t.title}`
                : `Reminder: ${t.title}`
            }
          >
            {done ? <Check size={13} /> : <Bell size={14} aria-hidden="true" />}
          </div>
        ) : (
          <button
            className={`grid size-5 shrink-0 cursor-pointer place-items-center rounded-full border ${
              done
                ? 'border-[#c2410c] bg-[#c2410c] text-white dark:border-[#fed7aa] dark:bg-[#fed7aa] dark:text-[#1f2937]'
                : 'border-[#667085] bg-transparent text-white'
            }`}
            aria-label={done ? `Uncomplete ${t.title}` : `Complete ${t.title}`}
            onClick={() => completeTask(t)}
          >
            {done && <Check size={13} />}
          </button>
        )}
        <div className="grid flex-1 gap-[5px]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`text-left border-0 bg-transparent p-0 cursor-pointer text-sm hover:underline ${
                done
                  ? 'text-[#667085] line-through dark:text-[#a7b0bf]'
                  : 'text-[#1f2937] dark:text-[#f3f4f6]'
              }`}
              title="Click to edit task"
              onClick={() => setEditingTask(t)}
            >
              {t.title}
            </button>
          </div>
          <small className="text-[11px] text-[#667085] dark:text-[#a7b0bf]">
            {[
              t.due && dl(t.due),
              t.time,
              t.repeat && t.repeat !== 'none' && `Repeats ${t.repeat}`,
              t.reminder &&
                `Reminder: ${reminderLabel(t.reminder, t.reminder_frequency, t.reminder_early).toLowerCase()}`,
              t.project,
              t.assignee && `For ${t.assignee.id === user.id ? 'you' : t.assignee.name}`,
              t.label,
            ]
              .filter(Boolean)
              .join(' · ')}
          </small>
        </div>
        {view === 'inbox' && isSaved(t) && !done && (
          <div
            ref={sorting?.taskId === t.id ? sortMenu : undefined}
            className={`relative flex items-center gap-1 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-[900px]:opacity-100 motion-reduce:transition-none ${
              sorting?.taskId === t.id ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              type="button"
              className={sortChipClass}
              aria-label={`Move ${t.title} to Today`}
              onClick={() => sortTask(t, { due: today() })}
            >
              Today
            </button>
            <button
              type="button"
              className={sortChipClass}
              aria-label={`Move ${t.title} to Tomorrow`}
              onClick={() => sortTask(t, { due: moveDate(new Date(), 1) })}
            >
              Tomorrow
            </button>
            <button
              type="button"
              className={`${dashboardIconButtonClass} text-[#667085] dark:text-[#a7b0bf]`}
              aria-label={`Pick a date for ${t.title}`}
              title="Pick a date"
              aria-haspopup="dialog"
              aria-expanded={sorting?.taskId === t.id && sorting.kind === 'date'}
              data-sort-trigger={
                sorting?.taskId === t.id && sorting.kind === 'date' ? '' : undefined
              }
              onClick={() =>
                setSorting((current) =>
                  current?.taskId === t.id && current.kind === 'date'
                    ? null
                    : { taskId: t.id, kind: 'date' },
                )
              }
            >
              <CalendarDays size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${dashboardIconButtonClass} text-[#667085] dark:text-[#a7b0bf]`}
              aria-label={`Move ${t.title} to a project`}
              title="Move to project"
              aria-haspopup="dialog"
              aria-expanded={sorting?.taskId === t.id && sorting.kind === 'project'}
              data-sort-trigger={
                sorting?.taskId === t.id && sorting.kind === 'project' ? '' : undefined
              }
              onClick={() =>
                setSorting((current) =>
                  current?.taskId === t.id && current.kind === 'project'
                    ? null
                    : { taskId: t.id, kind: 'project' },
                )
              }
            >
              <FolderInput size={16} aria-hidden="true" />
            </button>
            {sorting?.taskId === t.id && sorting.kind === 'date' && (
              <TaskDatePicker
                due=""
                placement="right-0"
                onSelect={(date) => sortTask(t, { due: date })}
              />
            )}
            {sorting?.taskId === t.id && sorting.kind === 'project' && (
              <SortProjectMenu
                taskTitle={t.title}
                projects={projects}
                onSelect={(name) => sortTask(t, { project: name })}
              />
            )}
          </div>
        )}
        {isSaved(t) && !done && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-[900px]:opacity-100 motion-reduce:transition-none">
            {assignees.length > 0 && (
              <select
                aria-label={`Assign ${t.title}`}
                className="h-8 max-w-[120px] cursor-pointer rounded-md border border-[#d9dee7] bg-transparent px-1.5 text-[12px] text-[#475467] dark:border-[#383838] dark:text-[#c9ced6]"
                value={t.assignee?.id ?? ''}
                onChange={(event) => {
                  const person = assignees.find(
                    (candidate) => candidate.id === Number(event.target.value),
                  )
                  updateTaskMutation.mutate({
                    task: t,
                    changes: {
                      assignee: person ? { id: person.id, name: person.name } : null,
                    },
                  })
                }}
              >
                <option value="">Anyone</option>
                {assignees.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.id === user.id ? 'Me' : person.name}
                  </option>
                ))}
              </select>
            )}
            {!isReminder && (
              <button
                className={`${dashboardIconButtonClass} relative text-[#667085] dark:text-[#a7b0bf]`}
                aria-label={`Focus on ${t.title}${hasPlus ? '' : lockedSuffix('plus')}`}
                aria-haspopup={hasPlus ? undefined : 'dialog'}
                title={hasPlus ? 'Focus' : 'Focus (Plus)'}
                onClick={() => (hasPlus ? setFocusTask(t) : setUpgradeOpen(true))}
              >
                <Timer size={16} />
                {!hasPlus && <PlanLock plan="plus" variant="dot" />}
              </button>
            )}
          </div>
        )}
        <button
          className={`${dashboardIconButtonClass} text-[#667085] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-orange-600 dark:text-[#a7b0bf] dark:hover:text-orange-400`}
          aria-label={`Edit ${t.title}`}
          title={`Edit ${t.title}`}
          onClick={() => setEditingTask(t)}
        >
          <Pencil size={15} />
        </button>
        <button
          className={`${dashboardIconButtonClass} text-[#667085] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-600 dark:text-[#a7b0bf] dark:hover:text-red-400`}
          aria-label={`Delete ${t.title}`}
          onClick={() => setDeleteTarget({ type: 'task', task: t })}
        >
          <Trash2 size={16} />
        </button>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-app-background font-sans text-[#1f2937] transition-colors duration-250 dark:text-[#f3f4f6] motion-reduce:transition-none">
      <DashboardSidebar
        view={view}
        onViewChange={go}
        projects={projects}
        sharedProjects={new Set(projectRows?.filter(isSharedProject).map((row) => row.name) ?? [])}
        ownedProjects={
          new Set(projectRows?.filter((row) => row.is_owner !== false).map((row) => row.name) ?? [])
        }
        projectsWithTasks={new Set(tasks.map((task) => task.project))}
        onAddTask={open}
        onAddProject={() => setAddProject(true)}
        onTryPro={() => setUpgradeOpen(true)}
        onDeleteProject={handleDeleteProjectClick}
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
          {isTrial && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-2.5 text-sm text-amber-900 shadow-xs dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  Free trial active: <strong>Daymark {user.plan === 'pro' ? 'Pro' : 'Plus'}</strong>
                  {billingQuery.data?.trial_ends_at &&
                    ` (ends ${new Date(billingQuery.data.trial_ends_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`}
                </span>
              </div>
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-xs transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-800 dark:bg-[#1f1f1f] dark:text-red-400 dark:hover:bg-red-950/40"
                disabled={cancelTrialMutation.isPending}
                onClick={() => cancelTrialMutation.mutate()}
              >
                {cancelTrialMutation.isPending
                  ? 'Cancelling trial…'
                  : 'Cancel free trial (temporary)'}
              </button>
            </div>
          )}
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
            {view === 'inbox' && visible.length > 0 && (
              <span className="mr-auto ml-3 shrink-0 pt-1.5 text-sm tabular-nums text-[#667085] max-[900px]:ml-0 dark:text-[#a7b0bf]">
                {visible.length} to sort
              </span>
            )}
            {currentProject && (
              <div className="ml-auto flex items-center gap-1">
                <button
                  className={`${dashboardIconButtonClass} relative text-[#667085] dark:text-[#a7b0bf]`}
                  aria-label={`Share project ${currentProject.name}${shareLocked ? lockedSuffix('pro') : ''}`}
                  aria-haspopup="dialog"
                  title={shareLocked ? 'Share (Pro)' : 'Share'}
                  onClick={() => setShareTarget(currentProject)}
                >
                  <UsersRound size={18} />
                  {shareLocked && <PlanLock plan="pro" variant="dot" />}
                </button>
                {currentProject.is_owner !== false && (
                  <button
                    className={`${dashboardIconButtonClass} text-[#667085] hover:text-red-600 dark:text-[#a7b0bf] dark:hover:text-red-400`}
                    aria-label={`Delete project ${currentProject.name}`}
                    title={`Delete project ${currentProject.name}`}
                    onClick={() => handleDeleteProjectClick(currentProject.name)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
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
              <div className="mb-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    taskType === 'normal'
                      ? 'bg-[#1f2937] text-white dark:bg-[#f2f2f2] dark:text-[#1f1f1f]'
                      : 'bg-[#f4f1e9] text-[#667085] hover:bg-[#e9e5da] dark:bg-[#383838] dark:text-[#a7b0bf] dark:hover:bg-[#444]'
                  }`}
                  onClick={() => {
                    setTaskType('normal')
                    setReminder(null)
                  }}
                >
                  Normal task
                </button>
                <button
                  type="button"
                  className={`flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    taskType === 'reminder'
                      ? 'bg-orange-600 text-white dark:bg-orange-500'
                      : 'bg-[#f4f1e9] text-[#667085] hover:bg-[#e9e5da] dark:bg-[#383838] dark:text-[#a7b0bf] dark:hover:bg-[#444]'
                  }`}
                  aria-label={`Reminder task${hasPlus ? '' : lockedSuffix('plus')}`}
                  aria-haspopup={hasPlus ? undefined : 'dialog'}
                  onClick={() => {
                    // Reminders are part of Plus; the API rejects them for free accounts.
                    if (!hasPlus) {
                      setUpgradeOpen(true)
                      return
                    }
                    setTaskType('reminder')
                    if (!reminder) {
                      setReminder({
                        reminder: (time || '09:00') as Reminder,
                        early: false,
                        frequency: null,
                      })
                    }
                    if (!due) setDue(today())
                  }}
                >
                  <Bell size={12} aria-hidden="true" />
                  Reminder task
                  {!hasPlus && <PlanLock plan="plus" className="ml-0.5" />}
                </button>
              </div>
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
                    aria-label={`Project: ${project || 'No project'}`}
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
                    <span className="truncate">{project || 'No project'}</span>
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
                          if (!projectSearch.trim() || (noProjectMatches && !projectMatches.length))
                            chooseProject('')
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
                        {noProjectMatches && (
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
                            <span className="flex-1">No project</span>
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
                {taskType === 'reminder' && (
                  <ReminderPicker
                    value={reminder?.reminder ?? null}
                    early={reminder?.early ?? false}
                    frequency={reminder?.frequency ?? null}
                    onChange={(next) => {
                      if (next && !due) setDue(today())
                      setReminder(next)
                      if (!next) setTaskType('normal')
                    }}
                    locked={!hasPlus}
                    onUpgrade={() => setUpgradeOpen(true)}
                    hasDueDate={!!due}
                    suggestedTime={time}
                  />
                )}
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
          {view === 'today' && <TodayCalendar />}
          {view === 'reporting' ? (
            <TaskReport />
          ) : view === 'focus' ? (
            <FocusView
              tasks={tasks}
              onFocus={setFocusTask}
              onAddTask={() => {
                open()
                setDue(today())
              }}
            />
          ) : view === 'shared' ? (
            <SharedProjectsView
              projects={projectRows ?? []}
              onOpen={(name) => go(`project:${name}`)}
              onShare={setShareTarget}
            />
          ) : view === 'reminders' ? (
            <ReminderSettings
              user={user}
              tasks={tasks}
              onEdit={(task) => setEditingTask(task)}
              onDelete={(task) => setDeleteTarget({ type: 'task', task })}
            />
          ) : view === 'calendar' ? (
            <CalendarSettings />
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
                  onComplete={completeTask}
                  onDelete={(task) => setDeleteTarget({ type: 'task', task })}
                  onEdit={(task) => setEditingTask(task)}
                />
              ) : view === 'today' ? (
                visible.length ? (
                  <div className="border-t border-[#d9dee7] dark:border-[#383838]">
                    {todayActiveTasks.length > 0 ? (
                      todayActiveTasks.map(renderTaskRow)
                    ) : (
                      <p className="py-4 text-sm text-[#667085] dark:text-[#a7b0bf]">
                        All active tasks completed for today.
                      </p>
                    )}
                    <button
                      className="flex cursor-pointer items-center gap-2 border-0 bg-transparent py-[13px] text-sm font-medium uppercase tracking-[0.05em] text-orange-600 dark:text-orange-400"
                      onClick={open}
                    >
                      <Plus size={18} /> Add task
                    </button>
                    {todayCompletedTasks.length > 0 && (
                      <div className="mt-8 border-t border-[#d9dee7] pt-5 dark:border-[#383838]">
                        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a7b0bf]">
                          Completed · {todayCompletedTasks.length}
                        </h2>
                        <div>{todayCompletedTasks.map(renderTaskRow)}</div>
                      </div>
                    )}
                  </div>
                ) : adding ? null : (
                  <Empty view={view} onAdd={open} />
                )
              ) : view === 'inbox' ? (
                <>
                  <form
                    aria-label="Add to Inbox"
                    className="flex min-h-14 items-center gap-3 border-y border-[#d9dee7] transition-shadow duration-150 focus-within:shadow-[inset_0_-2px_0_#c2410c] dark:border-[#383838] dark:focus-within:shadow-[inset_0_-2px_0_#fdba74] motion-reduce:transition-none"
                    onSubmit={(event) => {
                      event.preventDefault()
                      quickAdd()
                    }}
                  >
                    <Plus
                      size={20}
                      aria-hidden="true"
                      className="shrink-0 text-[#c2410c] dark:text-[#fdba74]"
                    />
                    <input
                      ref={quickAddInput}
                      className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[15px] text-[#1f2937] outline-none placeholder:text-[#667085] dark:text-[#f3f4f6] dark:placeholder:text-[#a7b0bf]"
                      value={quickDraft}
                      onChange={(event) => setQuickDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape' && quickDraft) {
                          event.preventDefault()
                          setQuickDraft('')
                        }
                      }}
                      placeholder="What’s on your mind?"
                      aria-label="Add a task to Inbox"
                      maxLength={255}
                    />
                    {quickDraft.trim() && (
                      <button
                        type="submit"
                        className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent px-2.5 text-xs font-medium text-[#475467] hover:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-[#c9ced6] dark:hover:bg-[#383838] dark:focus-visible:outline-[#fed7aa]"
                      >
                        <CornerDownLeft size={14} aria-hidden="true" />
                        Add
                      </button>
                    )}
                  </form>
                  {visible.length ? (
                    <div>{visible.map(renderTaskRow)}</div>
                  ) : (
                    !adding && <Empty view={view} cleared={sortedCount > 0} />
                  )}
                </>
              ) : visible.length ? (
                <div className="border-t border-[#d9dee7] dark:border-[#383838]">
                  {visible.map(renderTaskRow)}
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
      {hasPlus && <FocusPanel request={focusTask} onClose={() => setFocusTask(null)} />}
      {shareTarget && (
        <ShareProjectDialog
          project={projectRows?.find((row) => row.id === shareTarget.id) ?? shareTarget}
          onClose={() => setShareTarget(null)}
          onLeft={() => {
            setShareTarget(null)
            go('inbox')
          }}
        />
      )}
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
      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'task' ? 'Delete task?' : 'Delete project?'}
        description={
          deleteTarget?.type === 'task' ? (
            <>
              Are you sure you want to delete{' '}
              <strong className="font-semibold text-[#1f2937] dark:text-[#f3f4f6]">
                “{deleteTarget.task.title}”
              </strong>
              ? This action cannot be undone.
            </>
          ) : deleteTarget?.type === 'project' ? (
            <>
              Are you sure you want to delete the project{' '}
              <strong className="font-semibold text-[#1f2937] dark:text-[#f3f4f6]">
                “{deleteTarget.projectName}”
              </strong>
              ?
              {deleteTarget.taskCount > 0 ? (
                <span className="mt-1.5 block text-red-600 dark:text-red-400">
                  This will also permanently delete {deleteTarget.taskCount} task
                  {deleteTarget.taskCount > 1 ? 's' : ''} in this project.
                </span>
              ) : null}
              <span className="mt-1 block">This action cannot be undone.</span>
            </>
          ) : null
        }
        confirmLabel={deleteTarget?.type === 'task' ? 'Delete task' : 'Delete project'}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <ConfirmCompleteDialog
        isOpen={Boolean(completeTarget)}
        task={completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={confirmComplete}
      />
      <EditTaskDialog
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSave={(changes) => {
          if (editingTask) {
            updateTaskMutation.mutate({ task: editingTask, changes })
          }
        }}
        onDelete={(task) => setDeleteTarget({ type: 'task', task })}
        projects={projects}
        hasPlus={hasPlus}
        onUpgrade={() => setUpgradeOpen(true)}
      />
    </div>
  )
}
/** Without `onTimeChange` and `onRepeatChange` it is a plain date picker (used to sort Inbox). */
function TaskDatePicker({
  due,
  time = '',
  repeat = 'none',
  onSelect,
  onTimeChange,
  onRepeatChange,
  placement = 'left-0 max-[620px]:left-[-145px]',
}: {
  due: string
  time?: string
  repeat?: NonNullable<Task['repeat']>
  onSelect: (date: string) => void
  onTimeChange?: (time: string) => void
  onRepeatChange?: (repeat: NonNullable<Task['repeat']>) => void
  placement?: string
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
      className={`absolute top-[calc(100%+7px)] z-30 flex max-h-[min(660px,calc(100vh-270px))] w-[min(312px,calc(100vw-40px))] flex-col overflow-y-auto rounded-xl border border-[#d9dee7] bg-white text-[#1f2937] shadow-[0_16px_36px_#0002] dark:border-[#454545] dark:bg-[#292929] dark:text-[#f2f2f2] dark:shadow-[0_16px_36px_#0007] ${placement}`}
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
      {onTimeChange && onRepeatChange && (
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
              onChange={(event) =>
                onRepeatChange(event.target.value as NonNullable<Task['repeat']>)
              }
            >
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          )}
        </div>
      )}
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
/** Inbox has its own quick-add row, so its empty state has no button (`onAdd` is omitted). */
function Empty({
  view,
  onAdd,
  cleared = false,
}: {
  view: DashboardView
  onAdd?: () => void
  cleared?: boolean
}) {
  const c =
    view === 'inbox' && cleared
      ? ['Everything has a place', 'Your inbox is clear. New thoughts will land here.']
      : view === 'inbox'
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
    <div
      className={`mx-auto max-w-[360px] text-center ${view === 'inbox' ? 'mt-[10vh]' : 'mt-[18vh] max-[900px]:mt-[12vh]'}`}
    >
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
      {onAdd && view !== 'notifications' && (
        <button className={dashboardPrimaryClass} onClick={onAdd}>
          <Plus size={20} /> Add task
        </button>
      )}
    </div>
  )
}
function SortProjectMenu({
  taskTitle,
  projects,
  onSelect,
}: {
  taskTitle: string
  projects: string[]
  onSelect: (name: string) => void
}) {
  const [search, setSearch] = useState('')
  const query = search.trim()
  const matches = projects.filter((name) => name.toLowerCase().includes(query.toLowerCase()))
  const canCreate =
    !!query &&
    !projects.some((name) => name.toLowerCase() === query.toLowerCase()) &&
    !['inbox', 'no project'].includes(query.toLowerCase())
  const optionClass =
    'flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left text-sm text-[#1f2937] hover:bg-[#f4f1e9] focus-visible:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-orange-500 dark:text-[#f2f2f2] dark:hover:bg-[#393939] dark:focus-visible:bg-[#393939] dark:focus-visible:outline-[#fed7aa]'
  return (
    <div
      role="dialog"
      aria-label={`Move ${taskTitle} to a project`}
      className="absolute right-0 top-[calc(100%+7px)] z-30 w-[min(280px,calc(100vw-40px))] rounded-xl border border-[#d9dee7] bg-white p-[10px] text-[#1f2937] shadow-[0_16px_36px_#0002] dark:border-[#454545] dark:bg-[#292929] dark:text-[#f2f2f2] dark:shadow-[0_16px_36px_#0007]"
    >
      <input
        autoFocus
        className="box-border h-10 w-full rounded-lg border border-[#d9dee7] bg-transparent px-3 text-[15px] text-[#1f2937] outline-none placeholder:text-[#667085] focus:border-orange-500 dark:border-[#5d5d5d] dark:text-[#f2f2f2] dark:placeholder:text-[#aaa] dark:focus:border-[#a5a5a5]"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          if (matches.length && query) onSelect(matches[0])
          else if (canCreate) onSelect(query)
        }}
        placeholder={projects.length ? 'Find or create a project' : 'Name a new project'}
        aria-label="Find or create a project"
        maxLength={255}
      />
      <div className="mt-[10px] max-h-56 overflow-y-auto">
        {matches.map((name) => (
          <button key={name} type="button" className={optionClass} onClick={() => onSelect(name)}>
            <FolderInput
              size={18}
              aria-hidden="true"
              className="shrink-0 text-[#667085] dark:text-[#d0d0d0]"
            />
            <span className="min-w-0 flex-1 truncate">{name}</span>
          </button>
        ))}
        {canCreate && (
          <button type="button" className={optionClass} onClick={() => onSelect(query)}>
            <Plus size={18} aria-hidden="true" className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">Create “{query}”</span>
          </button>
        )}
        {!matches.length && !canCreate && (
          <p className="m-0 px-3 py-2 text-sm text-[#667085] dark:text-[#a7b0bf]">
            {projects.length
              ? 'No matching projects.'
              : 'No projects yet. Type a name to start one.'}
          </p>
        )}
      </div>
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
  onEdit,
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
  onEdit: (task: Task) => void
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
              <UpcomingTask
                key={task.id}
                task={task}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
              />
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
  onEdit,
}: {
  task: Task
  onComplete: (task: Task) => void
  onDelete: (task: Task) => void
  onEdit: (task: Task) => void
}) {
  const details = [
    task.time,
    task.project,
    task.label,
    task.repeat && task.repeat !== 'none' && `Repeats ${task.repeat}`,
    task.reminder &&
      `Reminder: ${reminderLabel(task.reminder, task.reminder_frequency, task.reminder_early).toLowerCase()}`,
  ].filter(Boolean)
  return (
    <div className="group flex min-w-0 items-start gap-3 rounded-lg bg-[#f7f6f2] p-3 dark:bg-[#313131]">
      {task.reminder ? (
        <div
          className="mt-0.5 grid size-5 shrink-0 place-items-center text-orange-600 dark:text-orange-400"
          title="Reminder"
          aria-label={`Reminder: ${task.title}`}
        >
          <Bell size={14} aria-hidden="true" />
        </div>
      ) : (
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
      )}
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="m-0 break-words text-left text-sm font-medium leading-5 text-[#27352f] dark:text-[#f3f4f6] border-0 bg-transparent p-0 cursor-pointer hover:underline"
          title="Click to edit task"
          onClick={() => onEdit(task)}
        >
          {task.title}
        </button>
        {details.length > 0 && (
          <p className="mb-0 mt-1 text-xs leading-5 text-[#59645e] dark:text-[#b6c0b8]">
            {details.join(' · ')}
          </p>
        )}
      </div>
      <button
        className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[#59645e] hover:bg-[#fff3e5] hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-[#b6c0b8] dark:hover:bg-orange-400/15 dark:hover:text-orange-300 dark:focus-visible:outline-orange-400"
        aria-label={`Edit ${task.title}`}
        title={`Edit ${task.title}`}
        onClick={() => onEdit(task)}
      >
        <Pencil size={15} aria-hidden="true" />
      </button>
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
