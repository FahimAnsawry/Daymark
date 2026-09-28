import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

type Props = {
  isOpen: boolean
  title: string
  description: React.ReactNode
  confirmLabel?: string
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmDeleteDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  onClose,
  onConfirm,
}: Props) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const prevActiveElement = document.activeElement as HTMLElement | null
    cancelBtnRef.current?.focus()

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
  }, [isOpen, onClose])

  if (!isOpen) return null

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
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-description"
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
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <AlertTriangle size={20} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-delete-title"
              className="m-0 font-display text-[1.18rem] font-semibold text-[#1f2937] dark:text-[#f2f4ee]"
            >
              {title}
            </h2>
            <div
              id="confirm-delete-description"
              className="mt-2 text-sm leading-relaxed text-[#556052] dark:text-[#a7b0bf]"
            >
              {description}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-[#e2e7df] pt-4 dark:border-[#383838]">
          <button
            ref={cancelBtnRef}
            type="button"
            className="cursor-pointer rounded-full border border-[#c7cfc2] bg-transparent px-4 py-2 text-sm font-semibold text-[#4b5563] transition-colors hover:bg-black/[0.05] dark:border-[#424242] dark:text-[#d1d5db] dark:hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 active:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
