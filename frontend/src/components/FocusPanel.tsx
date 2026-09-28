import { Pause, Play, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  FOCUS_PRESETS,
  formatClock,
  formatFocusDuration,
  MAX_FOCUS_MINUTES,
  MIN_FOCUS_MINUTES,
  useCurrentFocus,
  useFinishFocus,
  useStartFocus,
  type FocusSession,
} from '../lib/focus'
import type { Task } from '../lib/tasks'

type Props = {
  /** A task the person just chose to focus on, or null. */
  request: Task | null
  onClose: () => void
}

type Pauses = { total: number; since: number | null }

const panelClass =
  'fixed bottom-6 right-6 z-[45] w-[340px] rounded-2xl border border-[#e2e4e0] bg-white p-6 text-[#1f2937] shadow-[0_18px_48px_rgba(17,24,39,0.18)] dark:border-[#383838] dark:bg-[#262626] dark:text-[#f3f4f6] max-[520px]:inset-x-3 max-[520px]:bottom-3 max-[520px]:w-auto'
const mutedText = 'text-[#667085] dark:text-[#a7b0bf]'
const pillClass = (selected: boolean) =>
  `min-h-8 cursor-pointer rounded-full border px-3 text-[13px] font-semibold transition-colors ${
    selected
      ? 'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-400/20 dark:text-orange-200'
      : 'border-[#d9dee7] bg-transparent text-inherit hover:bg-black/[0.04] dark:border-[#484848] dark:hover:bg-white/[0.06]'
  }`
const buttonClass = (primary: boolean) =>
  `inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 text-[0.85rem] font-bold disabled:cursor-default disabled:opacity-60 ${
    primary
      ? 'border-0 btn-primary'
      : 'border border-[#d9dee7] bg-transparent text-inherit hover:bg-black/[0.04] dark:border-[#484848] dark:hover:bg-white/[0.06]'
  }`

/**
 * A calm focus timer (Plus): pick a length, start, pause if life happens, finish. Time spent
 * shows up in Reporting. The countdown itself runs in the browser.
 */
export function FocusPanel({ request, onClose }: Props) {
  const current = useCurrentFocus(true)
  const start = useStartFocus()
  const finish = useFinishFocus()
  const [minutes, setMinutes] = useState<number>(25)
  const [isCustom, setIsCustom] = useState<boolean>(false)
  const [customInput, setCustomInput] = useState<string>('20')
  const [summary, setSummary] = useState<{ minutes: number; title: string | null } | null>(null)
  const session = current.data ?? null

  const effectiveMinutes = isCustom
    ? Math.min(MAX_FOCUS_MINUTES, Math.max(MIN_FOCUS_MINUTES, parseInt(customInput, 10) || 25))
    : minutes

  const close = () => {
    setSummary(null)
    onClose()
  }

  if (summary) {
    return (
      <section className={panelClass} aria-labelledby="focus-title" role="region">
        <h2 id="focus-title" className="m-0 font-display text-[1.2rem] font-semibold">
          {summary.minutes > 0
            ? `${summary.minutes} ${summary.minutes === 1 ? 'minute' : 'minutes'} of focus`
            : 'Session ended'}
        </h2>
        <p className={`m-0 mt-1.5 text-sm ${mutedText}`}>
          {summary.title ? `On “${summary.title}”. ` : ''}Take a breath before the next thing.
        </p>
        <button type="button" className={`${buttonClass(true)} mt-5 w-full`} onClick={close}>
          Done
        </button>
      </section>
    )
  }

  if (session) {
    return (
      <RunningSession
        key={session.id}
        session={session}
        isFinishing={finish.isPending}
        onFinish={async (focusedSeconds) => {
          try {
            const ended = await finish.mutateAsync({ id: session.id, focusedSeconds })
            setSummary({ minutes: Math.floor(ended.focused_seconds / 60), title: ended.task_title })
          } catch (error) {
            toast.error('Could not save your focus session. Please try again.')
            throw error
          }
        }}
      />
    )
  }

  if (!request) return null

  return (
    <section className={panelClass} aria-labelledby="focus-title" role="region">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`m-0 text-[12px] font-semibold uppercase tracking-[0.06em] ${mutedText}`}>
            Focus on
          </p>
          <h2
            id="focus-title"
            className="m-0 mt-1 truncate font-display text-[1.15rem] font-semibold"
          >
            {request.title}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close focus"
          className={`grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent hover:bg-black/[0.06] dark:hover:bg-white/[0.08] ${mutedText}`}
          onClick={close}
        >
          <X size={18} />
        </button>
      </div>
      <fieldset className="m-0 mt-5 border-0 p-0">
        <legend className={`text-[12px] font-semibold uppercase tracking-[0.06em] ${mutedText}`}>
          Session length
        </legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FOCUS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={!isCustom && minutes === preset}
              className={pillClass(!isCustom && minutes === preset)}
              onClick={() => {
                setMinutes(preset)
                setIsCustom(false)
              }}
            >
              {formatFocusDuration(preset)}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={isCustom}
            className={pillClass(isCustom)}
            onClick={() => setIsCustom(true)}
          >
            Custom
          </button>
        </div>
        {isCustom && (
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="panel-custom-minutes" className={`text-xs ${mutedText}`}>
              Custom time:
            </label>
            <input
              id="panel-custom-minutes"
              type="number"
              min={MIN_FOCUS_MINUTES}
              max={MAX_FOCUS_MINUTES}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onBlur={() => {
                const val = parseInt(customInput, 10)
                if (isNaN(val) || val < MIN_FOCUS_MINUTES) {
                  setCustomInput(String(MIN_FOCUS_MINUTES))
                } else if (val > MAX_FOCUS_MINUTES) {
                  setCustomInput(String(MAX_FOCUS_MINUTES))
                }
              }}
              className="h-8 w-20 rounded-lg border border-[#d9dee7] bg-transparent px-2 text-center text-sm font-semibold tabular-nums text-inherit outline-none focus:border-orange-500 dark:border-[#484848]"
            />
            <span className={`text-xs ${mutedText}`}>min (5–180)</span>
          </div>
        )}
      </fieldset>
      <button
        type="button"
        autoFocus
        disabled={start.isPending}
        className={`${buttonClass(true)} mt-5 w-full`}
        onClick={() =>
          start.mutate(
            { taskId: request.id > 0 ? request.id : null, plannedMinutes: effectiveMinutes },
            { onError: () => toast.error('Could not start focus. Please try again.') },
          )
        }
      >
        <Play size={16} aria-hidden="true" />{' '}
        {start.isPending ? 'Starting…' : `Start focus (${formatFocusDuration(effectiveMinutes)})`}
      </button>
    </section>
  )
}

function RunningSession({
  session,
  isFinishing,
  onFinish,
}: {
  session: FocusSession
  isFinishing: boolean
  onFinish: (focusedSeconds: number) => Promise<void>
}) {
  const startedAt = new Date(session.started_at).getTime()
  const [now, setNow] = useState(() => Date.now())
  const [pauses, setPauses] = useState<Pauses>({ total: 0, since: null })
  const finished = useRef(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const pausedMs = pauses.total + (pauses.since ? now - pauses.since : 0)
  const focusedSeconds = Math.max(0, (now - startedAt - pausedMs) / 1000)
  const remaining = session.planned_minutes * 60 - focusedSeconds

  const end = (seconds: number) => {
    if (finished.current) return
    finished.current = true
    // Allow another try if saving failed.
    onFinish(seconds).catch(() => {
      finished.current = false
    })
  }

  // When time is up, finish once on its own; after a failed save the Finish button retries.
  const autoFinished = useRef(false)
  useEffect(() => {
    if (remaining > 0 || autoFinished.current) return
    autoFinished.current = true
    end(session.planned_minutes * 60)
  })

  const isPaused = pauses.since !== null

  return (
    <section className={panelClass} aria-labelledby="focus-title" role="region">
      <p className={`m-0 text-[12px] font-semibold uppercase tracking-[0.06em] ${mutedText}`}>
        {isPaused ? 'Paused' : 'Focusing'}
      </p>
      <h2 id="focus-title" className="m-0 mt-1 truncate font-display text-[1.15rem] font-semibold">
        {session.task_title ?? 'Focus session'}
      </h2>
      <p
        className="m-0 mt-4 text-center font-display text-[3.4rem] font-semibold leading-none tracking-[-0.03em] tabular-nums"
        aria-hidden="true"
      >
        {formatClock(remaining)}
      </p>
      <p className="sr-only" aria-live="off">
        {Math.ceil(remaining / 60)} minutes left
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          className={buttonClass(false)}
          onClick={() =>
            setPauses((current) =>
              current.since
                ? { total: current.total + (Date.now() - current.since), since: null }
                : { ...current, since: Date.now() },
            )
          }
        >
          {isPaused ? (
            <Play size={16} aria-hidden="true" />
          ) : (
            <Pause size={16} aria-hidden="true" />
          )}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          disabled={isFinishing}
          className={buttonClass(true)}
          onClick={() => end(focusedSeconds)}
        >
          Finish
        </button>
      </div>
    </section>
  )
}
