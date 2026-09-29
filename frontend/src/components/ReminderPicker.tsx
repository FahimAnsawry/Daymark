import { Bell, Lock } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import {
  FREQUENCY_OPTIONS,
  formatClockTime,
  isPastReminder,
  reminderLabel,
  type ReminderSetting,
} from '../lib/reminders'
import type { Reminder, ReminderFrequency } from '../lib/tasks'
import { lockedSuffix } from '../lib/plans'
import { PlanLock } from './PlanLock'

type Props = {
  /** The time the reminder goes out, like "05:00". */
  value: Reminder | null
  /** Sends it 10 minutes before that time. */
  early: boolean
  /** How often it repeats; null sends it once. */
  frequency: ReminderFrequency | null
  onChange: (setting: ReminderSetting) => void
  /** Reminders are part of Plus. When locked, saving one asks to upgrade instead. */
  locked: boolean
  onUpgrade: () => void
  /** Reminders go out on the task's date; without one, the caller dates the task today. */
  hasDueDate: boolean
  /** The task's date, used to refuse a reminder time that has already passed. */
  due?: string
  /** The task's own time, suggested when there's no reminder yet. */
  suggestedTime?: string
  variant?: 'field' | 'icon'
  taskTitle?: string
  canRemove?: boolean
}

const EARLY_MINUTES = 10

const frequencyClass =
  'h-8 flex-1 cursor-pointer rounded-md border-0 bg-transparent px-1 text-[13px] text-[#475467] hover:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-orange-500 aria-pressed:bg-[#1f2937] aria-pressed:font-medium aria-pressed:text-white dark:text-[#c9ced6] dark:hover:bg-[#393939] dark:aria-pressed:bg-[#f2f2f2] dark:aria-pressed:text-[#1f1f1f]'

/** "05:00" moved back by 10 minutes, as a readable time like "4:50 AM". */
const earlyTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  const total = (hours * 60 + minutes - EARLY_MINUTES + 24 * 60) % (24 * 60)
  return formatClockTime(`${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`)
}

export function ReminderPicker({
  value,
  early,
  frequency,
  onChange,
  locked,
  onUpgrade,
  hasDueDate,
  due,
  suggestedTime,
  variant = 'field',
  taskTitle,
  canRemove = true,
}: Props) {
  const [open, setOpen] = useState(false)
  // Edits stay in the menu until Save, so nothing changes halfway through.
  const [draftTime, setDraftTime] = useState('')
  const [draftEarly, setDraftEarly] = useState(false)
  const [draftFrequency, setDraftFrequency] = useState<ReminderFrequency | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const timeId = useId()
  const repeatId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  const openMenu = () => {
    setDraftTime(value ?? suggestedTime ?? '')
    setDraftEarly(early)
    setDraftFrequency(frequency)
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }

  const isPast = isPastReminder(due, draftTime)

  const save = () => {
    if (!draftTime || isPast) return
    close()
    if (locked) onUpgrade()
    else onChange({ reminder: draftTime as Reminder, early: draftEarly, frequency: draftFrequency })
  }

  const remove = () => {
    close()
    onChange(null)
  }

  const summary = value ? reminderLabel(value, frequency, early) : ''
  const accessibleLabel =
    (taskTitle
      ? `Reminder for ${taskTitle}: ${summary || 'none'}`
      : `Reminder: ${summary || 'none'}`) + (locked ? lockedSuffix('plus') : '')

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={accessibleLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={
          variant === 'icon'
            ? `relative grid size-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent hover:bg-black/[0.06] dark:hover:bg-white/[0.08] ${
                value
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-[#667085] dark:text-[#a7b0bf]'
              }`
            : 'flex min-h-[35px] cursor-pointer items-center gap-[7px] rounded-lg border border-[#d9dee7] bg-transparent px-[10px] text-sm text-[#1f2937] hover:bg-[#f4f1e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-[#484848] dark:text-[#f2f2f2] dark:hover:bg-[#383838]'
        }
      >
        <Bell size={16} aria-hidden="true" />
        {variant === 'field' && <span>{summary || 'Remind me'}</span>}
        {locked &&
          (variant === 'icon' ? (
            <PlanLock plan="plus" variant="dot" />
          ) : (
            <Lock
              size={12}
              strokeWidth={2.5}
              aria-hidden="true"
              className="text-[#c2410c] dark:text-[#fdba74]"
            />
          ))}
      </button>
      {open && (
        // Not a <form>: the add-task dialog around this picker already is one.
        <div
          id={panelId}
          role="dialog"
          aria-label="Reminder"
          className="absolute right-0 top-[calc(100%+7px)] z-30 w-[270px] rounded-xl border border-[#d9dee7] bg-white p-3 text-[#1f2937] shadow-[0_16px_36px_#0002] dark:border-[#454545] dark:bg-[#292929] dark:text-[#f2f2f2] dark:shadow-[0_16px_36px_#0007]"
        >
          {locked && (
            <p className="m-0 mb-2 flex items-center justify-between gap-2 text-[12px] text-[#5d6a62] dark:text-[#a7b0bf]">
              Save one to try Plus
              <PlanLock plan="plus" />
            </p>
          )}
          <div className="flex items-center gap-2">
            <label htmlFor={timeId} className="flex-1 text-sm font-medium">
              Remind me at
            </label>
            <input
              id={timeId}
              type="time"
              value={draftTime}
              onChange={(event) => setDraftTime(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                save()
              }}
              className="h-8 rounded-md border border-[#d9dee7] bg-transparent px-1.5 text-sm text-inherit focus-visible:outline-2 focus-visible:outline-orange-500 dark:border-[#484848] dark:[color-scheme:dark]"
            />
          </div>
          {!hasDueDate && (
            <p className="m-0 mt-1.5 text-[12px] text-[#667085] dark:text-[#a7b0bf]">
              The task has no date, so this starts today.
            </p>
          )}

          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-orange-600"
              checked={draftEarly}
              onChange={(event) => setDraftEarly(event.target.checked)}
            />
            <span>
              <span className="block">{EARLY_MINUTES} minutes before</span>
              {draftTime && (
                <span className="block text-[12px] text-[#667085] dark:text-[#a7b0bf]">
                  {draftEarly
                    ? `Reminds you at ${earlyTime(draftTime)}`
                    : `Reminds you at ${formatClockTime(draftTime)}`}
                </span>
              )}
            </span>
          </label>

          <div className="mt-3 border-t border-[#e8e5dc] pt-2.5 dark:border-[#3d3d3d]">
            <p
              id={repeatId}
              className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a7b0bf]"
            >
              Repeat
            </p>
            <div role="group" aria-labelledby={repeatId} className="mt-1.5 flex gap-1">
              {FREQUENCY_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={draftFrequency === option.value}
                  className={frequencyClass}
                  onClick={() => setDraftFrequency(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {canRemove && value && (
              <button
                type="button"
                onClick={remove}
                className="h-8 cursor-pointer rounded-md border-0 bg-transparent px-2 text-sm text-[#b42318] hover:bg-[#fef3f2] focus-visible:outline-2 focus-visible:outline-orange-500 dark:text-[#fda29b] dark:hover:bg-white/[0.06]"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              disabled={!draftTime || isPast}
              onClick={save}
              className="ml-auto h-8 cursor-pointer rounded-md border-0 px-3 text-sm font-medium btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
