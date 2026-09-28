import { Link } from '@tanstack/react-router'
import { CalendarDays } from 'lucide-react'
import { usePlan } from '../lib/auth-context'
import {
  formatDuration,
  freeMinutesLeft,
  useCalendarEvents,
  useCalendarStatus,
  type CalendarEvent,
} from '../lib/calendar'
import { localDate } from '../lib/tasks'
import { PlanLock } from './PlanLock'

const mutedText = 'text-[#667085] dark:text-[#a7b0bf]'

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

/**
 * Today's Google Calendar events above the task list, with how much of the day is still
 * free (Pro). Without Pro it's one quiet locked line; without a connection, one quiet link.
 */
export function TodayCalendar() {
  const { has } = usePlan()
  const isPro = has('pro')
  const status = useCalendarStatus(isPro)
  const today = localDate(new Date())
  const events = useCalendarEvents(today, isPro && status.data?.connected === true)

  if (!isPro) {
    return (
      <Link
        to="/dashboard"
        search={{ view: 'calendar' }}
        className={`group mb-6 flex w-fit max-w-full items-center gap-2 rounded-full py-1 pr-1 text-sm no-underline ${mutedText} hover:text-[#1f2937] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:hover:text-[#f3f4f6]`}
      >
        <CalendarDays size={16} aria-hidden="true" className="shrink-0" />
        <span className="min-w-0 underline-offset-4 group-hover:underline">
          See your Google Calendar beside today&rsquo;s plan
        </span>
        <PlanLock plan="pro" />
      </Link>
    )
  }

  if (status.isPending) return null

  if (!status.data?.connected) {
    return (
      <p className={`mb-6 flex items-center gap-2 text-sm ${mutedText}`}>
        <CalendarDays size={16} aria-hidden="true" />
        <Link
          to="/dashboard"
          search={{ view: 'calendar' }}
          className="text-inherit underline-offset-4 hover:underline"
        >
          Connect Google Calendar
        </Link>
        to see your events here.
      </p>
    )
  }

  if (events.isPending) {
    return (
      <p className={`mb-6 text-sm ${mutedText}`} role="status">
        Loading your calendar…
      </p>
    )
  }

  if (events.isError) {
    return (
      <p className={`mb-6 text-sm ${mutedText}`}>
        We couldn&rsquo;t reach Google Calendar.{' '}
        <Link
          to="/dashboard"
          search={{ view: 'calendar' }}
          className="text-inherit underline underline-offset-4"
        >
          Check the connection
        </Link>
      </p>
    )
  }

  const list = events.data.events
  const free = freeMinutesLeft(list)

  return (
    <section aria-labelledby="today-calendar-title" className="mb-8">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="today-calendar-title" className="m-0 text-sm font-semibold">
          Your calendar
        </h2>
        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[12px] font-bold text-orange-800 dark:bg-orange-400/15 dark:text-orange-200">
          {free > 0 ? `${formatDuration(free)} free today` : 'No free time left today'}
        </span>
      </div>
      {list.length === 0 ? (
        <p className={`m-0 text-sm ${mutedText}`}>Nothing on your calendar today.</p>
      ) : (
        <ul className="m-0 grid list-none gap-1.5 p-0">
          {list.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </section>
  )
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <li className="flex items-baseline gap-3 rounded-lg bg-[#f7f6f2] px-3 py-2 text-sm dark:bg-[#262626]">
      <span className={`w-[108px] shrink-0 tabular-nums ${mutedText}`}>
        {event.all_day ? 'All day' : `${timeOf(event.start)}–${timeOf(event.end)}`}
      </span>
      <span className="min-w-0 truncate">{event.title}</span>
    </li>
  )
}
