import { Bell, Calendar, Clock, Folder, RotateCw, Tag, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Repeat, Task, TaskChanges } from '../lib/tasks'
import { ReminderPicker } from './ReminderPicker'
import type { ReminderSetting } from '../lib/reminders'

type Props = {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onSave: (changes: TaskChanges) => void
  onDelete: (task: Task) => void
  projects: string[]
  hasPlus: boolean
  onUpgrade: () => void
}

export function EditTaskDialog({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  projects,
  hasPlus,
  onUpgrade,
}: Props) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [time, setTime] = useState('')
  const [project, setProject] = useState('')
  const [label, setLabel] = useState('')
  const [repeat, setRepeat] = useState<Repeat>('none')
  const [reminder, setReminder] = useState<ReminderSetting>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDue(task.due || '')
      setTime(task.time || '')
      setProject(task.project || '')
      setLabel(task.label || '')
      setRepeat(task.repeat || 'none')
      setReminder(
        task.reminder
          ? {
              reminder: task.reminder,
              early: task.reminder_early ?? false,
              frequency: task.reminder_frequency ?? null,
            }
          : null,
      )
    }
  }, [task])

  useEffect(() => {
    if (!isOpen) return
    const prevActiveElement = document.activeElement as HTMLElement | null
    titleInputRef.current?.focus()

    const origOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = origOverflow
      document.removeEventListener('keydown', handleKeyDown)
      prevActiveElement?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen || !task) return null

  const isExistingReminderTask = Boolean(task.reminder)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const reminderValue = isExistingReminderTask
      ? (reminder?.reminder ?? task.reminder)
      : (reminder?.reminder ?? null)

    onSave({
      title: title.trim(),
      due: due || '',
      time: isExistingReminderTask ? (reminder?.reminder ?? time ?? '') : (time || ''),
      project: project || '',
      label: label.trim(),
      repeat,
      reminder: reminderValue,
      reminder_early: reminder?.early ?? false,
      reminder_frequency: reminder?.frequency ?? null,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-[2px] animate-dialog-fade-in motion-reduce:animate-none overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-task-title"
        className="relative my-8 w-full max-w-[520px] rounded-2xl border border-[#d9dee7] bg-[#fafbf8] p-6 text-[#1f2937] shadow-[0_20px_50px_rgba(0,0,0,0.25)] animate-dialog-slide-up dark:border-[#424242] dark:bg-[#262626] dark:text-[#f2f2f2] motion-reduce:animate-none"
      >
        <button
          type="button"
          className="absolute right-4 top-4 grid size-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[#667085] hover:bg-black/[0.06] hover:text-[#1f2937] dark:text-[#a7b0bf] dark:hover:bg-white/[0.08] dark:hover:text-[#f3f4f6]"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <h2
          id="edit-task-title"
          className="m-0 font-display text-[1.25rem] font-semibold text-[#1f2937] dark:text-[#f2f4ee]"
        >
          Edit Task
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a7b0bf]">
              Task Title
            </label>
            <input
              ref={titleInputRef}
              type="text"
              required
              className="box-border h-10 w-full rounded-lg border border-[#d9dee7] bg-white px-3 text-sm text-[#1f2937] outline-none placeholder:text-[#667085] focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-[#424242] dark:bg-[#1e1e1e] dark:text-[#f2f2f2] dark:focus:border-orange-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
            />
          </div>

          {isExistingReminderTask ? (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a7b0bf]">
                <Calendar size={13} /> Due Date
              </label>
              <input
                type="date"
                className="box-border h-10 w-full rounded-lg border border-[#d9dee7] bg-white px-3 text-sm text-[#1f2937] outline-none focus:border-orange-500 dark:border-[#424242] dark:bg-[#1e1e1e] dark:text-[#f2f2f2] dark:focus:border-orange-400"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a7b0bf]">
                  <Calendar size={13} /> Due Date
                </label>
                <input
                  type="date"
                  className="box-border h-10 w-full rounded-lg border border-[#d9dee7] bg-white px-3 text-sm text-[#1f2937] outline-none focus:border-orange-500 dark:border-[#424242] dark:bg-[#1e1e1e] dark:text-[#f2f2f2] dark:focus:border-orange-400"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a7b0bf]">
                  <Clock size={13} /> Time (optional)
                </label>
                <input
                  type="time"
                  className="box-border h-10 w-full rounded-lg border border-[#d9dee7] bg-white px-3 text-sm text-[#1f2937] outline-none focus:border-orange-500 dark:border-[#424242] dark:bg-[#1e1e1e] dark:text-[#f2f2f2] dark:focus:border-orange-400"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a7b0bf]">
                <Folder size={13} /> Project
              </label>
              <select
                className="box-border h-10 w-full rounded-lg border border-[#d9dee7] bg-white px-3 text-sm text-[#1f2937] outline-none focus:border-orange-500 dark:border-[#424242] dark:bg-[#1e1e1e] dark:text-[#f2f2f2] dark:focus:border-orange-400"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a7b0bf]">
                <RotateCw size={13} /> Repeat
              </label>
              <select
                className="box-border h-10 w-full rounded-lg border border-[#d9dee7] bg-white px-3 text-sm text-[#1f2937] outline-none focus:border-orange-500 dark:border-[#424242] dark:bg-[#1e1e1e] dark:text-[#f2f2f2] dark:focus:border-orange-400"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as Repeat)}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a7b0bf]">
              <Tag size={13} /> Label (optional)
            </label>
            <input
              type="text"
              className="box-border h-10 w-full rounded-lg border border-[#d9dee7] bg-white px-3 text-sm text-[#1f2937] outline-none placeholder:text-[#667085] focus:border-orange-500 dark:border-[#424242] dark:bg-[#1e1e1e] dark:text-[#f2f2f2] dark:focus:border-orange-400"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. urgent, health, finances"
            />
          </div>

          {reminder && (
            <div className="rounded-xl border border-[#d9dee7] bg-white p-3 dark:border-[#424242] dark:bg-[#1e1e1e]">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a7b0bf]">
                  <Bell size={13} /> Reminder Settings
                </span>
                {!isExistingReminderTask && (
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent text-xs text-red-600 hover:underline dark:text-red-400"
                    onClick={() => setReminder(null)}
                  >
                    Remove reminder
                  </button>
                )}
              </div>
              <div className="flex items-center">
                <ReminderPicker
                  value={reminder.reminder}
                  early={reminder.early}
                  frequency={reminder.frequency}
                  canRemove={!isExistingReminderTask}
                  onChange={(next) => {
                    if (isExistingReminderTask && !next?.reminder) return
                    if (next && !due) {
                      const now = new Date()
                      setDue(
                        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
                      )
                    }
                    setReminder(next)
                  }}
                  locked={!hasPlus}
                  onUpgrade={onUpgrade}
                  hasDueDate={Boolean(due)}
                  suggestedTime={time}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-[#e2e7df] pt-4 dark:border-[#383838]">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-red-300 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
              onClick={() => {
                onClose()
                onDelete(task)
              }}
            >
              <Trash2 size={14} /> Delete
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-full border border-[#c7cfc2] bg-transparent px-4 py-2 text-sm font-semibold text-[#4b5563] transition-colors hover:bg-black/[0.05] dark:border-[#424242] dark:text-[#d1d5db] dark:hover:bg-white/[0.08]"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-500"
                disabled={!title.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
