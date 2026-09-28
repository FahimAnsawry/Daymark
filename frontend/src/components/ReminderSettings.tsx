import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePlan, type User } from '../lib/auth-context'
import { errorMessage, useUpdatePreferences } from '../lib/billing'
import {
  enablePush,
  formatClockTime,
  notificationsSupported,
  pushSupported,
} from '../lib/reminders'
import { localDate, useDeleteTask, type Task } from '../lib/tasks'
import { PlusGate, PreviewRow } from './PlusGate'
import {
  settingsMutedText as mutedText,
  settingsPanel as panel,
  settingsPrimaryButton as primaryButton,
  settingsQuietButton as quietButton,
} from './SettingsLayout'

/** Gentle reminders (Plus): quiet hours, and what's coming up. */
export function ReminderSettings({
  user,
  tasks,
  onEdit,
  onDelete,
}: {
  user: User
  tasks: Task[]
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
}) {
  const { has } = usePlan()

  return (
    <div className="max-w-[640px]">
      {has('plus') ? (
        <>
          <QuietHoursPanel user={user} />
          <UpcomingReminders user={user} tasks={tasks} onEdit={onEdit} onDelete={onDelete} />
        </>
      ) : (
        <PlusGate
          plan="plus"
          title="Reminders that respect your evenings"
          description="Get a nudge at the time you choose, on this device and by email. Nothing arrives during your quiet hours."
          preview={
            <div className="grid gap-2">
              <PreviewRow>
                Call mom <span className={mutedText}>Today, 17:00</span>
              </PreviewRow>
              <PreviewRow>
                Quiet hours <span className={mutedText}>21:00 to 07:00</span>
              </PreviewRow>
            </div>
          }
        />
      )}
    </div>
  )
}

/** The current time, refreshed each minute so reminders that have gone out leave the list. */
function useMinuteClock() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

const dayHeading = (date: Date, now: number) => {
  const today = new Date(now)
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  if (localDate(date) === localDate(today)) return 'Today'
  if (localDate(date) === localDate(tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

const clockTime = (date: Date) =>
  formatClockTime(`${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`)

/**
 * Reminders that haven't gone out yet, soonest first, grouped by day. Only the
 * person's own tasks: a reminder on someone else's shared task goes to its owner.
 */
function UpcomingReminders({
  user,
  tasks,
  onEdit,
  onDelete,
}: {
  user: User
  tasks: Task[]
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
}) {
  const now = useMinuteClock()
  const deleteTaskMutation = useDeleteTask()

  const days = useMemo(() => {
    const upcoming = tasks
      .filter((task) => !task.done && task.remind_at && (task.user_id ?? user.id) === user.id)
      .map((task) => ({ task, at: new Date(task.remind_at!) }))
      .filter(({ at }) => at.getTime() > now)
      .sort((a, b) => a.at.getTime() - b.at.getTime())

    const groups = new Map<string, typeof upcoming>()
    for (const item of upcoming) {
      const heading = dayHeading(item.at, now)
      groups.set(heading, [...(groups.get(heading) ?? []), item])
    }
    return [...groups.entries()]
  }, [tasks, user.id, now])

  return (
    <section aria-labelledby="upcoming-title" className={`${panel} mt-5`}>
      <h2
        id="upcoming-title"
        className="m-0 font-display text-[1.15rem] font-semibold tracking-[-0.02em]"
      >
        Upcoming reminders
      </h2>
      <NotificationPrompt />
      {days.length === 0 ? (
        <p className={`m-0 mt-5 text-sm ${mutedText}`}>
          Nothing coming up. Use the bell on a task to set a reminder.
        </p>
      ) : (
        <div className="mt-5 grid gap-5">
          {days.map(([heading, items]) => (
            <div key={heading}>
              <h3
                className={`m-0 text-[12px] font-semibold uppercase tracking-[0.06em] ${mutedText}`}
              >
                {heading}
              </h3>
              <ul className="m-0 mt-2 list-none divide-y divide-[#e8e5dc] p-0 dark:divide-[#3a3a3a]">
                {items.map(({ task, at }) => (
                  <li key={task.id} className="group flex items-center gap-3 py-2.5">
                    <time
                      dateTime={at.toISOString()}
                      className="w-[72px] shrink-0 text-sm font-medium tabular-nums text-orange-600 dark:text-orange-400"
                    >
                      {clockTime(at)}
                    </time>
                    <span className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="m-0 block truncate border-0 bg-transparent p-0 text-left text-sm font-medium text-inherit hover:underline cursor-pointer"
                        title="Click to edit task"
                        onClick={() => onEdit?.(task)}
                      >
                        {task.title}
                      </button>
                      {(task.project || task.reminder_frequency || task.reminder_early) && (
                        <span className={`block truncate text-[12px] ${mutedText}`}>
                          {[
                            task.reminder_early &&
                              task.reminder &&
                              `10 min before ${formatClockTime(task.reminder)}`,
                            task.reminder_frequency && `Repeats ${task.reminder_frequency}`,
                            task.project,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      aria-label={`Edit ${task.title}`}
                      title="Edit reminder"
                      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[#667085] hover:bg-[#fff3e5] hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-orange-500 dark:text-[#a7b0bf] dark:hover:bg-orange-400/15 dark:hover:text-orange-300"
                      onClick={() => onEdit?.(task)}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${task.title}`}
                      title="Delete reminder"
                      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[#667085] hover:bg-[#fff3e5] hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-500 dark:text-[#a7b0bf] dark:hover:bg-orange-400/15 dark:hover:text-red-400"
                      onClick={() => (onDelete ? onDelete(task) : deleteTaskMutation.mutate(task))}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/** Asks for notification permission until it's granted, then stays out of the way. */
function NotificationPrompt() {
  const supported = notificationsSupported()
  const [permission, setPermission] = useState(() =>
    supported ? Notification.permission : 'denied',
  )
  const [pushError, setPushError] = useState(false)

  const allow = async () => {
    const next = await Notification.requestPermission()
    setPermission(next)
    if (next !== 'granted' || !pushSupported()) return
    setPushError(!(await enablePush().catch(() => false)))
  }

  if (!supported || (permission === 'granted' && !pushError)) return null

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm dark:bg-[#1f1f1f]">
      {permission === 'granted' ? (
        <span>
          Notifications only appear while Daymark is open. We couldn&rsquo;t set up background
          notifications.
        </span>
      ) : permission === 'denied' ? (
        <span>
          Notifications are blocked. You can allow them in your browser&rsquo;s site settings.
        </span>
      ) : (
        <>
          <span className="flex-1">Get reminders on this device, even when Daymark is closed.</span>
          <button type="button" className={primaryButton} onClick={() => void allow()}>
            Allow notifications
          </button>
        </>
      )}
    </div>
  )
}

function QuietHoursPanel({ user }: { user: User }) {
  const update = useUpdatePreferences()
  const [start, setStart] = useState(user.quiet_hours_start ?? '21:00')
  const [end, setEnd] = useState(user.quiet_hours_end ?? '07:00')
  const isOn = Boolean(user.quiet_hours_start && user.quiet_hours_end)

  return (
    <section aria-labelledby="quiet-title" className={`${panel} mt-8`}>
      <h2
        id="quiet-title"
        className="m-0 font-display text-[1.15rem] font-semibold tracking-[-0.02em]"
      >
        Quiet hours
      </h2>
      <p className={`m-0 mt-1.5 max-w-[52ch] text-sm leading-[1.55] ${mutedText}`}>
        {isOn
          ? `Nothing is sent between ${user.quiet_hours_start} and ${user.quiet_hours_end}. Reminders that fall inside wait until quiet hours end.`
          : 'Choose a stretch of time when Daymark stays silent.'}
      </p>
      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          update.mutate({ quiet_hours_start: start, quiet_hours_end: end })
        }}
      >
        <label className="grid gap-1 text-sm font-medium">
          From
          <input
            type="time"
            required
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="min-h-10 rounded-lg border border-[#d9dee7] bg-white px-3 text-inherit dark:border-[#484848] dark:bg-[#1f1f1f]"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          To
          <input
            type="time"
            required
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className="min-h-10 rounded-lg border border-[#d9dee7] bg-white px-3 text-inherit dark:border-[#484848] dark:bg-[#1f1f1f]"
          />
        </label>
        <button type="submit" className={primaryButton} disabled={update.isPending}>
          {isOn ? 'Save' : 'Turn on'}
        </button>
        {isOn && (
          <button
            type="button"
            className={quietButton}
            disabled={update.isPending}
            onClick={() => update.mutate({ quiet_hours_start: null, quiet_hours_end: null })}
          >
            Turn off
          </button>
        )}
      </form>
      {update.isError && (
        <p role="alert" className="m-0 mt-2 text-sm text-red-700 dark:text-red-300">
          {errorMessage(update.error, 'We couldn’t save that. Please try again.')}
        </p>
      )}
    </section>
  )
}
