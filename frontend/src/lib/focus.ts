import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { taskKeys } from './tasks'

/** A focus session (Plus). Pauses happen in the browser; the server stores focused time. */
export type FocusSession = {
  id: number
  task_id: number | null
  task_title: string | null
  planned_minutes: number
  started_at: string
  ended_at: string | null
  focused_seconds: number
}

export const FOCUS_PRESETS = [15, 20, 25, 30, 50, 60] as const
export type FocusPreset = (typeof FOCUS_PRESETS)[number]

export const MIN_FOCUS_MINUTES = 5
export const MAX_FOCUS_MINUTES = 180

export function formatFocusDuration(minutes: number): string {
  if (minutes % 60 === 0) {
    return `${minutes / 60}h`
  }
  return `${minutes} min`
}

export const focusKey = ['focus', 'current'] as const

/** The running session, so a reload picks the timer back up. */
export function useCurrentFocus(enabled: boolean) {
  return useQuery({
    queryKey: focusKey,
    queryFn: async () =>
      (await api.get<{ data: FocusSession | null }>('/focus-sessions/current')).data.data,
    enabled,
    staleTime: Infinity,
  })
}

export function useStartFocus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { taskId: number | null; plannedMinutes: number }) =>
      (
        await api.post<{ data: FocusSession }>('/focus-sessions', {
          task_id: input.taskId,
          planned_minutes: input.plannedMinutes,
        })
      ).data.data,
    onSuccess: (session) => queryClient.setQueryData(focusKey, session),
  })
}

export function useFinishFocus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: number; focusedSeconds: number }) =>
      (
        await api.patch<{ data: FocusSession }>(`/focus-sessions/${input.id}`, {
          focused_seconds: Math.max(0, Math.round(input.focusedSeconds)),
        })
      ).data.data,
    onSuccess: () => {
      queryClient.setQueryData(focusKey, null)
      void queryClient.invalidateQueries({ queryKey: taskKeys.reports })
    },
  })
}

/** 1490 seconds as "24:50"; 3600 seconds as "1:00:00". */
export const formatClock = (seconds: number) => {
  const whole = Math.max(0, Math.ceil(seconds))
  const hrs = Math.floor(whole / 3600)
  const mins = Math.floor((whole % 3600) / 60)
  const secs = whole % 60
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
