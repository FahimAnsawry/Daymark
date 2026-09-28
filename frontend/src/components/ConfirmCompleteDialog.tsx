import { CheckCircle2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { Task } from '../lib/tasks'

type Props = {
  isOpen: boolean
  task: Task | null
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmCompleteDialog({
  isOpen,
  task,
  onClose,
  onConfirm,
}: Props) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !task) return

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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
  }, [isOpen, task, onClose])

  if (!isOpen || !task) return null

  const isRecurring = Boolean(task.repeat && task.repeat !== 'none')

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-[2px] animate-dialog-fade-in motion-reduce:animate-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-complete-title"
        aria-describedby="confirm-complete-description"
        className="relative w-full max-w-[440px] rounded-2xl border border-[#d9dee7] bg-[#fafbf8] p-6 text-[#1f2937] shadow-[0_20px_50px_rgba(0,0,0,0.25)] animate-dialog-slide-up dark:border-[#424242] dark:bg-[#262626] dark:text-[#f2f2f2] motion-reduce:animate-none"
      >
        <button
          type="button"
          className="absolute right-4 top-4 grid size-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[#667085] hover:bg-black/[0.06] hover:text-[#1f2937] dark:text-[#a7b0bf] dark:hover:bg-white/[0.08] dark:hover:text-[#f3f4f6]"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4 pr-6">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
            <CheckCircle2 size={20} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-complete-title"
              className="m-0 font-display text-[1.18rem] font-semibold text-[#1f2937] dark:text-[#f2f4ee]"
            >
              Complete task?
            </h2>
            <div
              id="confirm-complete-description"
              className="mt-2 text-sm leading-relaxed text-[#556052] dark:text-[#a7b0bf]"
            >
              Are you sure you want to mark{' '}
              <strong className="font-semibold text-[#1f2937] dark:text-[#f3f4f6]">
                “{task.title}”
              </strong>{' '}
              as complete?
              {isRecurring && (
                <span className="mt-1.5 block text-xs text-[#667085] dark:text-[#a7b0bf]">
                  This task repeats {task.repeat} and will advance to the next due date.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-[#e2e7df] pt-4 dark:border-[#383838]">
          <button
            type="button"
            className="cursor-pointer rounded-full border border-[#c7cfc2] bg-transparent px-4 py-2 text-sm font-semibold text-[#4b5563] transition-colors hover:bg-black/[0.05] dark:border-[#424242] dark:text-[#d1d5db] dark:hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className="cursor-pointer rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 active:bg-orange-800 dark:bg-orange-600 dark:hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            onClick={onConfirm}
          >
            Mark as complete
          </button>
        </div>
      </div>
    </div>
  )
}
