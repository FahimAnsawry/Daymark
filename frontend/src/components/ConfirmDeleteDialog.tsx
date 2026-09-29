import { Trash2, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  isOpen: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  /** Shown in the red disc above the title. */
  icon?: LucideIcon
  onClose: () => void
  onConfirm: () => void
}

type Content = Pick<Props, 'title' | 'description' | 'confirmLabel' | 'icon'>

/** How long the panel takes to leave; matches `animate-dialog-panel-out`. */
const EXIT_MS = 170
/** The icon settles and the rule fills before the item is actually removed. */
const CONFIRM_MS = 380

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function ConfirmDeleteDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  icon = Trash2,
  onClose,
  onConfirm,
}: Props) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  // The parent passes a fresh callback each render; read the latest one when the timer fires.
  const onConfirmRef = useRef(onConfirm)
  useEffect(() => {
    onConfirmRef.current = onConfirm
  })

  // Keep the last content on screen while the dialog animates out, since the
  // parent usually clears its target the moment the dialog closes.
  const [shown, setShown] = useState<Content | null>(
    isOpen ? { title, description, confirmLabel, icon } : null,
  )
  const [closing, setClosing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (isOpen && (!shown || closing)) {
    setShown({ title, description, confirmLabel, icon })
    setClosing(false)
    setConfirming(false)
  } else if (isOpen && shown && !confirming && shown.title !== title) {
    setShown({ title, description, confirmLabel, icon })
  } else if (!isOpen && shown && !closing) {
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
    if (!isOpen) return

    const prevActiveElement = document.activeElement as HTMLElement | null
    // Deleting can't be undone, so the safe choice holds focus.
    cancelBtnRef.current?.focus()

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
  }, [isOpen, onClose])

  if (!shown) return null

  const Icon = shown.icon ?? Trash2

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
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-description"
        className={`relative w-full overflow-hidden rounded-t-[24px] border border-b-0 border-[#e2e7df] bg-[#fafbf8] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 text-center text-[#1f2937] shadow-[0_-8px_40px_-12px_rgba(16,24,40,0.3)] sm:max-w-[400px] sm:rounded-[20px] sm:border-b sm:pb-6 sm:shadow-[0_1px_2px_rgba(16,24,40,0.06),0_24px_64px_-12px_rgba(16,24,40,0.28)] dark:border-[#3a3a3a] dark:bg-[#262626] dark:text-[#f2f2f2] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6)] motion-reduce:animate-none ${
          closing ? 'animate-dialog-panel-out' : 'animate-dialog-panel-in'
        }`}
      >
        {/* A thin rule that fills while the deletion settles. */}
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-[3px] origin-left bg-red-600 transition-transform ease-out ${
            confirming ? 'scale-x-100 duration-[380ms]' : 'scale-x-0 duration-0'
          }`}
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
            className={`absolute inset-0 rounded-full bg-red-500/30 animate-ring-ripple motion-reduce:hidden ${
              confirming ? '[animation-delay:0ms]' : ''
            }`}
          />
          <span
            className={`relative grid size-14 place-items-center rounded-full bg-red-600 text-white shadow-[0_6px_16px_-6px_rgba(220,38,38,0.6)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] animate-check-pop motion-reduce:animate-none ${
              confirming ? 'scale-90' : 'scale-100'
            }`}
          >
            <Icon
              size={24}
              strokeWidth={2.25}
              aria-hidden="true"
              className={`transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                confirming ? 'translate-y-0.5 -rotate-12' : 'rotate-0'
              }`}
            />
          </span>
        </div>

        <h2
          id="confirm-delete-title"
          className="m-0 mt-5 font-display text-[1.3rem] font-semibold leading-tight tracking-[-0.02em] text-balance text-[#1f2937] animate-rise-in [animation-delay:60ms] motion-reduce:animate-none dark:text-[#f2f4ee]"
        >
          {shown.title}
        </h2>

        <div
          id="confirm-delete-description"
          className="mx-auto mt-2 max-w-[32ch] text-[0.95rem] leading-relaxed text-[#556052] animate-rise-in [animation-delay:110ms] motion-reduce:animate-none dark:text-[#a7b0bf]"
        >
          {shown.description}
        </div>

        <div className="mt-6 grid gap-2 animate-rise-in [animation-delay:160ms] motion-reduce:animate-none">
          <button
            type="button"
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full border-0 bg-red-600 px-5 text-[0.95rem] font-semibold text-white shadow-sm transition-[background-color,transform] hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:scale-[0.98] active:bg-red-800 disabled:cursor-default dark:hover:bg-red-500"
            onClick={() => setConfirming(true)}
            disabled={confirming}
          >
            {shown.confirmLabel ?? 'Delete'}
          </button>
          <button
            ref={cancelBtnRef}
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
