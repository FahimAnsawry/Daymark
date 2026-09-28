import { useEffect, useState } from 'react'
import { api } from './api'
import { localDate, type Reminder, type ReminderFrequency, type Task } from './tasks'

/** How often a reminder repeats. Choosing none sends it once. */
export const FREQUENCY_OPTIONS: Array<{ value: ReminderFrequency | null; label: string }> = [
  { value: null, label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

/** A reminder at a clock time on the due date, like "17:00". */
export const isReminderTime = (
  reminder: Reminder | null | undefined,
): reminder is `${string}:${string}` => !!reminder && /^([01]\d|2[0-3]):[0-5]\d$/.test(reminder)

/** "17:00" in the viewer's own clock format, like "5:00 PM". */
export const formatClockTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** A reminder the person picked, with its options. Null means no reminder. */
export type ReminderSetting = {
  reminder: Reminder
  early: boolean
  frequency: ReminderFrequency | null
} | null

/** "At 5:00 AM", with ", 10 min before" and ", daily" when they apply. */
export const reminderLabel = (
  reminder: Reminder | null | undefined,
  frequency?: ReminderFrequency | null,
  early?: boolean,
) => {
  if (!isReminderTime(reminder)) return ''
  return [`At ${formatClockTime(reminder)}`, early && '10 min before', frequency]
    .filter(Boolean)
    .join(', ')
}

/** Browser timers can't reliably reach further ahead than this; later ones are set on a later visit. */
const LOOKAHEAD_MS = 12 * 60 * 60 * 1000

export const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window

/** Web Push lets reminders arrive even when Daymark isn't open. */
export const pushSupported = () =>
  notificationsSupported() && 'serviceWorker' in navigator && 'PushManager' in window

const base64UrlToBytes = (value: string) => {
  const base64 = (value + '='.repeat((4 - (value.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

const sameKey = (current: ArrayBuffer | null, expected: Uint8Array) =>
  !!current &&
  current.byteLength === expected.byteLength &&
  new Uint8Array(current).every((byte, index) => byte === expected[index])

/**
 * Subscribes this browser to reminder notifications and tells the server about it.
 * Needs notification permission already granted. Resolves false when the server
 * doesn't have push set up.
 */
export async function enablePush() {
  const { data } = await api.get<{ public_key: string | null }>('/push/key')
  if (!data.public_key) return false
  const key = base64UrlToBytes(data.public_key)

  await navigator.serviceWorker.register('/sw.js')
  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  // A subscription made with an older server key can't receive new pushes.
  if (subscription && !sameKey(subscription.options.applicationServerKey, key)) {
    await subscription.unsubscribe()
    subscription = null
  }
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  })

  await api.post('/push/subscriptions', {
    ...subscription.toJSON(),
    content_encoding: PushManager.supportedContentEncodings?.includes('aes128gcm')
      ? 'aes128gcm'
      : 'aesgcm',
  })
  return true
}

/** Stops reminder notifications in this browser, for example on sign out. */
export async function disablePush() {
  if (!pushSupported()) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  await api.delete('/push/subscriptions', { data: { endpoint: subscription.endpoint } })
  await subscription.unsubscribe()
}

/**
 * Keeps this browser subscribed to reminder pushes while notifications are allowed.
 * Returns whether push is active, so the open tab doesn't notify a second time.
 */
function usePushReminders(enabled: boolean) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (!enabled || !pushSupported() || Notification.permission !== 'granted') return
    let cancelled = false
    enablePush()
      .then((ok) => !cancelled && setActive(ok))
      .catch(() => !cancelled && setActive(false))
    return () => {
      cancelled = true
    }
  }, [enabled])
  return enabled && active
}

/**
 * Shows reminders as browser notifications. With Web Push they arrive even when
 * Daymark is closed; otherwise the open tab shows them. The server emails them too,
 * and handles quiet hours.
 */
export function useReminderNotifications(tasks: Task[], enabled: boolean) {
  const pushActive = usePushReminders(enabled)
  useEffect(() => {
    if (!enabled || pushActive) return
    if (!notificationsSupported() || Notification.permission !== 'granted') return
    const now = Date.now()
    const timers = tasks
      .filter((task) => !task.done && task.remind_at)
      .map((task) => ({ task, at: new Date(task.remind_at!).getTime() }))
      .filter(({ at }) => at > now && at - now < LOOKAHEAD_MS)
      .map(({ task, at }) =>
        window.setTimeout(() => {
          new Notification(task.title, {
            body: [task.time, task.project].filter(Boolean).join(' · ') || 'A gentle reminder',
            tag: `daymark-task-${task.id}`,
          })
          void api.post(`/tasks/${task.id}/complete`, { completed_on: localDate(new Date()) })
        }, at - now),
      )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [tasks, enabled, pushActive])
}
