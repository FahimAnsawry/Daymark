import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from './api.ts'
import { buildImportPayload, legacyStorageKeys } from './task-import.ts'

export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly'

/** How often a reminder repeats. None means it's sent once. */
export type ReminderFrequency = 'daily' | 'weekly' | 'monthly'

/** A reminder (Plus) is the clock time it goes out on the due date, like "05:00". */
export type Reminder = `${string}:${string}`

export type Person = { id: number; name: string }

export type Task = {
  id: number
  /** Who created the task; reminders go to them. */
  user_id?: number
  title: string
  done: boolean
  due: string
  project: string
  label: string
  time?: string
  repeat?: Repeat
  reminder?: Reminder | null
  /** Sends the reminder 10 minutes before its time. */
  reminder_early?: boolean
  reminder_frequency?: ReminderFrequency | null
  /** When the reminder fires, in ISO 8601 (set by the server). */
  remind_at?: string | null
  project_id?: number | null
  /** Who the task is assigned to, in a shared project (Pro). */
  assignee?: Person | null
  completed_at?: string | null
}

export type TaskInput = Omit<
  Task,
  'id' | 'user_id' | 'done' | 'remind_at' | 'completed_at' | 'project_id' | 'assignee'
>

/** Fields that can change on an existing task from the dashboard. */
export type TaskChanges = {
  title?: string
  due?: string
  time?: string
  project?: string
  label?: string
  repeat?: Repeat
  reminder?: Reminder | null
  reminder_early?: boolean
  reminder_frequency?: ReminderFrequency | null
  assignee?: Person | null
}

export type TaskReport = {
  group: 'day' | 'week'
  from: string
  to: string
  buckets: Array<{ start: string; completed: number }>
  totals: { completed: number; open: number; overdue: number }
  by_project: Array<{ project: string; completed: number }>
  /** Days in a row with something done; Pro only (null otherwise). */
  streak: number | null
  /** Minutes spent in focus sessions in the range; Plus only (null otherwise). */
  focus_minutes: number | null
}

export const taskKeys = {
  tasks: ['tasks'] as const,
  projects: ['projects'] as const,
  reports: ['reports'] as const,
  report: (group: string, from: string, to: string) => ['reports', group, from, to] as const,
}

export const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function nextRepeatDate(due: string, repeat: Task['repeat']) {
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

/** Mirrors the backend's complete endpoint: repeating tasks with a due date roll forward, tracking completions for today. */
export function completeTaskLocally(task: Task): Task {
  const isRepeating =
    (task.repeat && task.repeat !== 'none') ||
    Boolean(
      task.reminder_frequency && ['daily', 'weekly', 'monthly'].includes(task.reminder_frequency),
    )
  const todayStr = localDate(new Date())
  const isCompletedToday =
    task.done || (task.completed_at ? task.completed_at.slice(0, 10) === todayStr : false)

  if (isCompletedToday) {
    return {
      ...task,
      done: false,
      completed_at: null,
      ...(isRepeating && { due: todayStr }),
    }
  }

  const repeatInterval =
    task.repeat && task.repeat !== 'none' ? task.repeat : task.reminder_frequency
  return isRepeating && task.due
    ? {
        ...task,
        completed_at: new Date().toISOString(),
        due: nextRepeatDate(task.due, repeatInterval as Repeat),
      }
    : {
        ...task,
        done: true,
        completed_at: new Date().toISOString(),
      }
}

export function useTasks(enabled: boolean) {
  return useQuery({
    queryKey: taskKeys.tasks,
    queryFn: async () => (await api.get<{ data: Task[] }>('/tasks')).data.data,
    enabled,
  })
}

/** A project row from the API. Shared projects (Pro) carry who owns them. */
export type ProjectRow = {
  id: number
  name: string
  tasks_count?: number
  members_count?: number
  is_owner?: boolean
  owner_name?: string
}

const fetchProjects = async () => (await api.get<{ data: ProjectRow[] }>('/projects')).data.data

export function useProjects(enabled: boolean) {
  return useQuery({
    queryKey: taskKeys.projects,
    queryFn: fetchProjects,
    select: (projects) => projects.map((project) => project.name),
    enabled,
  })
}

/** Full project rows (same cache as useProjects), for sharing details. */
export function useProjectRows(enabled: boolean) {
  return useQuery({ queryKey: taskKeys.projects, queryFn: fetchProjects, enabled })
}

export function useTaskReport(group: 'day' | 'week', from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.report(group, from, to),
    enabled,
    queryFn: async () =>
      (
        await api.get<TaskReport>('/reports/tasks', {
          params: { group, from, to, today: localDate(new Date()) },
        })
      ).data,
  })
}

const readStorage = (key: string): unknown => {
  try {
    const value = localStorage.getItem(key)
    return value === null ? undefined : JSON.parse(value)
  } catch {
    return undefined
  }
}

/**
 * Tasks used to live only in localStorage. Copies any left there into the database once,
 * then removes them. If the upload fails the data stays put and is retried next visit.
 * Returns true while the import is running.
 */
export function useLocalTaskImport(userId: number | undefined) {
  const queryClient = useQueryClient()
  const importQuery = useQuery({
    queryKey: ['tasks-import', userId],
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async () => {
      const keys = legacyStorageKeys(userId!)
      const localTasks = readStorage(keys.tasks)
      const localProjects = readStorage(keys.projects)
      if (localTasks === undefined && localProjects === undefined) return 0

      const payload = buildImportPayload(localTasks, localProjects)
      let imported = 0
      if (payload.tasks.length || payload.projects.length) {
        try {
          imported = (await api.post<{ imported: number }>('/tasks/import', payload)).data.imported
        } catch {
          toast.error(
            'Could not move your saved tasks to your account. We will try again next visit.',
          )
          return 0
        }
      }

      try {
        localStorage.removeItem(keys.tasks)
        localStorage.removeItem(keys.projects)
      } catch {
        // Storage unavailable; the import skips tasks it already has, so a retry is harmless.
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.tasks }),
        queryClient.invalidateQueries({ queryKey: taskKeys.projects }),
      ])
      return imported
    },
  })

  return importQuery.isLoading
}

type Snapshot = Array<[QueryKey, unknown]>

/**
 * Applies `update` to cached queries right away, then rolls it back if the request fails.
 * Tasks, projects and reports are refetched once the request settles.
 */
function useOptimisticMutation<TVariables>(
  request: (variables: TVariables) => Promise<unknown>,
  update: (variables: TVariables, client: ReturnType<typeof useQueryClient>) => void,
  errorMessage: string,
) {
  const queryClient = useQueryClient()
  return useMutation<unknown, Error, TVariables, Snapshot>({
    mutationFn: request,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.tasks })
      await queryClient.cancelQueries({ queryKey: taskKeys.projects })
      const snapshot: Snapshot = [
        [taskKeys.tasks, queryClient.getQueryData(taskKeys.tasks)],
        [taskKeys.projects, queryClient.getQueryData(taskKeys.projects)],
      ]
      update(variables, queryClient)
      return snapshot
    },
    onError: (_error, _variables, snapshot) => {
      snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error(errorMessage)
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.tasks }),
        queryClient.invalidateQueries({ queryKey: taskKeys.projects }),
        queryClient.invalidateQueries({ queryKey: taskKeys.reports }),
      ]),
  })
}

const addProjectToCache = (client: ReturnType<typeof useQueryClient>, name: string) => {
  if (!name) return
  client.setQueryData<ProjectRow[]>(taskKeys.projects, (current = []) =>
    current.some((project) => project.name === name)
      ? current
      : [...current, { id: -Date.now(), name }],
  )
}

export function useCreateTask() {
  return useOptimisticMutation<TaskInput>(
    (input) => api.post('/tasks', input),
    (input, client) => {
      client.setQueryData<Task[]>(taskKeys.tasks, (current = []) => [
        ...current,
        { ...input, id: -Date.now(), done: false },
      ])
      addProjectToCache(client, input.project)
    },
    'Could not save the task. Please try again.',
  )
}

export function useCompleteTask() {
  return useOptimisticMutation<Task>(
    (task) => api.post(`/tasks/${task.id}/complete`, { completed_on: localDate(new Date()) }),
    (task, client) =>
      client.setQueryData<Task[]>(taskKeys.tasks, (current = []) =>
        current.map((item) => (item.id === task.id ? completeTaskLocally(item) : item)),
      ),
    'Could not update the task. Please try again.',
  )
}

export function useAutoCompleteTask() {
  return useOptimisticMutation<Task>(
    (task) => api.post(`/tasks/${task.id}/auto-complete`, { completed_on: localDate(new Date()) }),
    (task, client) =>
      client.setQueryData<Task[]>(taskKeys.tasks, (current = []) =>
        current.map((item) => (item.id === task.id ? completeTaskLocally(item) : item)),
      ),
    'Could not auto-complete the task.',
  )
}

export function useUpdateTask() {
  return useOptimisticMutation<{ task: Task; changes: TaskChanges }>(
    ({ task, changes }) =>
      api.patch(`/tasks/${task.id}`, {
        ...('title' in changes && { title: changes.title }),
        ...('due' in changes && { due: changes.due }),
        ...('time' in changes && { time: changes.time }),
        ...('project' in changes && { project: changes.project }),
        ...('label' in changes && { label: changes.label }),
        ...('repeat' in changes && { repeat: changes.repeat }),
        ...('reminder' in changes && { reminder: changes.reminder }),
        ...('reminder_early' in changes && { reminder_early: changes.reminder_early }),
        ...('reminder_frequency' in changes && {
          reminder_frequency: changes.reminder_frequency,
        }),
        ...('assignee' in changes && { assignee_id: changes.assignee?.id ?? null }),
      }),
    ({ task, changes }, client) => {
      client.setQueryData<Task[]>(taskKeys.tasks, (current = []) =>
        current.map((item) => (item.id === task.id ? { ...item, ...changes } : item)),
      )
      if (changes.project) addProjectToCache(client, changes.project)
    },
    'Could not update the task. Please try again.',
  )
}

export function useDeleteTask() {
  return useOptimisticMutation<Task>(
    (task) => api.delete(`/tasks/${task.id}`),
    (task, client) =>
      client.setQueryData<Task[]>(taskKeys.tasks, (current = []) =>
        current.filter((item) => item.id !== task.id),
      ),
    'Could not delete the task. Please try again.',
  )
}

export function useCreateProject() {
  return useOptimisticMutation<string>(
    (name) => api.post('/projects', { name }),
    (name, client) => addProjectToCache(client, name),
    'Could not save the project. Please try again.',
  )
}

/** Deletes the project and its tasks, matching the dashboard's confirmation dialog. */
export function useDeleteProject() {
  return useOptimisticMutation<string>(
    async (name) => {
      // The dashboard only knows project names, and the optimistic update has already
      // removed the project from the cache, so look its id up on the server.
      const projects = (await api.get<{ data: ProjectRow[] }>('/projects')).data.data
      const project = projects.find((item) => item.name === name)
      if (project) await api.delete(`/projects/${project.id}`)
    },
    (name, client) => {
      client.setQueryData<ProjectRow[]>(taskKeys.projects, (current = []) =>
        current.filter((project) => project.name !== name),
      )
      client.setQueryData<Task[]>(taskKeys.tasks, (current = []) =>
        current.filter((task) => task.project !== name),
      )
    },
    'Could not delete the project. Please try again.',
  )
}
