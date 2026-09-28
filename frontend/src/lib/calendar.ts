import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

export type CalendarStatus = { connected: boolean; email: string | null }

export type CalendarEvent = {
  id: string
  title: string
  /** ISO date-time, or YYYY-MM-DD for all-day events. */
  start: string
  end: string
  all_day: boolean
}

export const calendarKeys = {
  status: ['calendar', 'status'] as const,
  events: (date: string) => ['calendar', 'events', date] as const,
}

export function useCalendarStatus(enabled = true) {
  return useQuery({
    queryKey: calendarKeys.status,
    queryFn: async () => (await api.get<CalendarStatus>('/calendar')).data,
    enabled,
  })
}

/** One day's Google Calendar events (Pro). */
export function useCalendarEvents(date: string, enabled: boolean) {
  return useQuery({
    queryKey: calendarKeys.events(date),
    queryFn: async () =>
      (
        await api.get<{ connected: boolean; events: CalendarEvent[] }>('/calendar/events', {
          params: { date },
        })
      ).data,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

/** Sends the browser to Google's consent screen (read-only calendar access). */
export async function connectGoogleCalendar() {
  const { data } = await api.post<{ url: string }>('/calendar/google/connect')
  window.location.assign(data.url)
}

export function useDisconnectCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.delete<CalendarStatus>('/calendar')).data,
    onSuccess: (status) => {
      queryClient.setQueryData(calendarKeys.status, status)
      void queryClient.removeQueries({ queryKey: ['calendar', 'events'] })
    },
  })
}

/** The part of the day Daymark counts as plannable when working out free time. */
export const DAY_END_HOUR = 21

/**
 * Minutes left between now and the end of the planning day that no timed event covers.
 * Overlapping events are merged so shared time isn't counted twice.
 */
export function freeMinutesLeft(events: CalendarEvent[], now = new Date()): number {
  const dayEnd = new Date(now)
  dayEnd.setHours(DAY_END_HOUR, 0, 0, 0)
  if (now >= dayEnd) return 0

  const busy = events
    .filter((event) => !event.all_day)
    .map((event) => [
      Math.max(new Date(event.start).getTime(), now.getTime()),
      Math.min(new Date(event.end).getTime(), dayEnd.getTime()),
    ])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0])

  let busyMs = 0
  let cursor = now.getTime()
  for (const [start, end] of busy) {
    const from = Math.max(start, cursor)
    if (end > from) {
      busyMs += end - from
      cursor = end
    }
  }

  return Math.max(0, Math.floor((dayEnd.getTime() - now.getTime() - busyMs) / 60000))
}

/** 200 minutes as "3h 20m". */
export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours ? (rest ? `${hours}h ${rest}m` : `${hours}h`) : `${rest}m`
}
