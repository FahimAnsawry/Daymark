import { Check, Repeat, Undo2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { setSkipCompleteConfirm } from '../lib/complete-confirm'
import { nextRepeatDate, type Task } from '../lib/tasks'

type Mode = 'complete' | 'uncomplete'

type Props = {
  isOpen: boolean
  task: Task | null
  /** Whether the person is finishing the task or reopening one that is already done. */
  mode?: Mode
  onClose: () => void
  onConfirm: () => void
}

/** How long the panel takes to leave; matches `animate-dialog-panel-out`. */
const EXIT_MS = 170
/** The tick settles and the ring pulses before the task actually moves. */
const CONFIRM_MS = 480

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const formatDue = (due: string) => {
  const date = new Date(`${due}T12:00:00`)
  if (Number.isNaN(date.getTime())) return due
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function ConfirmCompleteDialog({
  isOpen,
  task,
  mode = 'complete',
  onClose,
  onConfirm,
}: Props) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const skipId = useId()
  const open = isOpen && task !== null
  // The parent passes a fresh callback each render; read the latest one when the timer fires.
  const onConfirmRef = useRef(onConfirm)
  useEffect(() => {
    onConfirmRef.current = onConfirm
  })

  // Keep the last task on screen while the dialog animates out, since the
  // parent clears it the moment the dialog closes.
  const [shown, setShown] = useState<{ task: Task; mode: Mode } | null>(
    open ? { task, mode } : null,
  )
  const [closing, setClosing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [skipNextTime, setSkipNextTime] = useState(false)

  if (open && (shown?.task.id !== task.id || shown.mode !== mode || closing)) {
    setShown({ task, mode })
    setClosing(false)
    setConfirming(false)
    setSkipNextTime(false)
  } else if (!open && shown && !closing) {
    setClosing(true)
  }

  useEffect(() => {
    if (!closing) return
    const id = window.setTimeout(
      () => {
        setShown(null)
        setClosing(false)
        setConfirming(false)
      },
      prefersReducedMotion() ? 0 : EXIT_MS,
    )
    return () => window.clearTimeout(id)
  }, [closing])

  useEffect(() => {
    if (!confirming) return
    const id = window.setTimeout(
      () => onConfirmRef.current(),
      prefersReducedMotion() ? 0 : CONFIRM_MS,
    )
    return () => window.clearTimeout(id)
  }, [confirming])

  useEffect(() => {
    if (!open) return

    const prevActiveElement = document.activeElement as HTMLElement | null
    confirmBtnRef.current?.focus()

    const origOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = origOverflow
      document.removeEventListener('keydown', handleKeyDown)
      prevActiveElement?.focus()
    }
  }, [open, onClose])

  if (!shown) return null

  const { task: current } = shown
  const reopening = shown.mode === 'uncomplete'
  const isRecurring = Boolean(current.repeat && current.repeat !== 'none')

  const confirm = () => {
    if (!reopening && skipNextTime) setSkipCompleteConfirm(true)
    setConfirming(true)
  }

  return (
    <div
      className={`fixed inset-0 z-[70] grid items-end justify-items-center bg-[#0f1411]/55 backdrop-blur-[3px] sm:items-center sm:p-4 motion-reduce:animate-none ${
        closing ? 'animate-dialog-fade-out' : 'animate-dialog-fade-in'
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !closing && !confirming) onClose()
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-complete-title"
        aria-describedby="confirm-complete-description"
        className={`relative w-full overflow-hidden rounded-t-[24px] border border-b-0 border-[#e2e7df] bg-[#fafbf8] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 text-center text-[#1f2937] shadow-[0_-8px_40px_-12px_rgba(16,24,40,0.3)] sm:max-w-[400px] sm:rounded-[20px] sm:border-b sm:pb-6 sm:shadow-[0_1px_2px_rgba(16,24,40,0.06),0_24px_64px_-12px_rgba(16,24,40,0.28)] dark:border-[#3a3a3a] dark:bg-[#262626] dark:text-[#f2f2f2] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6)] motion-reduce:animate-none ${
          closing ? 'animate-dialog-panel-out' : 'animate-dialog-panel-in'
        }`}
      >
        {/* A thin rule that fills while the confirmation settles. */}
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-[3px] origin-left transition-transform ease-out ${
            reopening ? 'bg-[#c2410c] dark:bg-[#fdba74]' : 'bg-green-600'
          } ${confirming ? 'scale-x-100 duration-[480ms]' : 'scale-x-0 duration-0'}`}
        />

        {/* Grab handle, only where the dialog sits as a bottom sheet. */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2.5 h-1 w-9 -translate-x-1/2 rounded-full bg-[#d9dee7] sm:hidden dark:bg-[#424242]"
        />

        <div className="relative mx-auto grid size-14 place-items-center">
          {/* Replays on confirm, so the ring answers the click. */}
          <span
            key={confirming ? 'confirmed' : 'open'}
            aria-hidden="true"
            className={`absolute inset-0 rounded-full animate-ring-ripple motion-reduce:hidden ${
              reopening ? 'bg-orange-400/35' : 'bg-green-500/35'
            } ${confirming ? '[animation-delay:0ms]' : ''}`}
          />
          <span
            className={`relative grid size-14 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              reopening
                ? 'bg-orange-50 text-[#c2410c] ring-1 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-900/70'
                : 'bg-green-600 text-white shadow-[0_6px_16px_-6px_rgba(22,163,74,0.6)]'
            } ${confirming ? 'scale-110' : 'scale-100'} animate-check-pop motion-reduce:animate-none`}
          >
            {reopening ? (
              <Undo2
                size={24}
                strokeWidth={2.25}
                aria-hidden="true"
                className={`transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                  confirming ? '-rotate-[360deg]' : 'rotate-0'
                }`}
              />
            ) : (
              <svg
                key={confirming ? 'done' : 'idle'}
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  className="animate-check-draw [animation-delay:140ms] motion-reduce:animate-none"
                />
              </svg>
            )}
          </span>
        </div>

        <h2
          id="confirm-complete-title"
          className="m-0 mt-5 font-display text-[1.3rem] font-semibold leading-tight tracking-[-0.02em] text-balance text-[#1f2937] animate-rise-in [animation-delay:60ms] motion-reduce:animate-none dark:text-[#f2f4ee]"
        >
          {reopening ? 'Pick this back up?' : 'Done with this one?'}
        </h2>

        <p
          id="confirm-complete-description"
          className="m-0 mx-auto mt-2 max-w-[30ch] text-[0.95rem] leading-relaxed text-[#556052] animate-rise-in [animation-delay:110ms] motion-reduce:animate-none dark:text-[#a7b0bf]"
        >
          <strong className="line-clamp-2 break-words font-semibold text-[#1f2937] dark:text-[#f3f4f6]">
            {current.title}
          </strong>
        </p>

        {isRecurring && (
          <p className="m-0 mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#eef3ec] px-3 py-1 text-xs text-[#3f5a4a] animate-rise-in [animation-delay:140ms] motion-reduce:animate-none dark:bg-[#1d2a24] dark:text-[#b8cfc1]">
            <Repeat size={13} strokeWidth={2} className="shrink-0" aria-hidden="true" />
            Repeats {current.repeat}.{' '}
            {reopening
              ? 'Due today again.'
              : current.due
                ? `Next due ${formatDue(nextRepeatDate(current.due, current.repeat)).toLowerCase()}.`
                : 'Moves to the next due date.'}
          </p>
        )}

        {!reopening && (
          <div className="mt-5 animate-rise-in [animation-delay:160ms] motion-reduce:animate-none">
            <label
              htmlFor={skipId}
              className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-[#556052] dark:text-[#a7b0bf]"
            >
              <input
                id={skipId}
                type="checkbox"
                checked={skipNextTime}
                onChange={(e) => setSkipNextTime(e.target.checked)}
                disabled={confirming}
                className="size-4 cursor-pointer rounded accent-[#c2410c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:accent-[#fed7aa]"
              />
              Don't ask me again
            </label>
            {/* Grid rows animate height without measuring. */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
                skipNextTime ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
              aria-live="polite"
            >
              <p className="m-0 overflow-hidden text-xs text-[#6b746c] dark:text-[#8f98a4]">
                {skipNextTime && (
                  <span className="block pt-1">You can turn this back on in Settings.</span>
                )}
              </p>
            </div>
          </div>
        )}

        <div
          className={`grid gap-2 animate-rise-in [animation-delay:190ms] motion-reduce:animate-none ${
            reopening ? 'mt-6' : 'mt-4'
          }`}
        >
          <button
            ref={confirmBtnRef}
            type="button"
            className="btn-primary inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-[0.95rem] font-semibold shadow-sm transition-[background-color,transform] active:scale-[0.98] disabled:cursor-default"
            onClick={confirm}
            disabled={confirming}
          >
            {confirming && (
              <Check
                size={17}
                strokeWidth={3}
                aria-hidden="true"
                className="animate-check-pop motion-reduce:animate-none"
              />
            )}
            {confirming
              ? reopening
                ? 'Reopened'
                : 'Completed'
              : reopening
                ? 'Reopen task'
                : 'Mark complete'}
          </button>
          <button
            type="button"
            className="h-11 w-full cursor-pointer rounded-full border-0 bg-transparent px-5 text-sm font-semibold text-[#4b5563] transition-colors hover:bg-black/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-default disabled:opacity-50 dark:text-[#d1d5db] dark:hover:bg-white/[0.08]"
            onClick={onClose}
            disabled={confirming}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
