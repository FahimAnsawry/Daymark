import { Timer } from 'lucide-react'
import { usePlan } from '../lib/auth-context'
import { formatDuration } from '../lib/duration'
import { FOCUS_PRESETS, formatFocusDuration, useCurrentFocus } from '../lib/focus'
import { localDate, useTaskReport, type Task } from '../lib/tasks'
import { PlusGate } from './PlusGate'

type Props = {
  /** Open tasks, already filtered by the dashboard; the view keeps today's and overdue ones. */
  tasks: Task[]
  onFocus: (task: Task) => void
  onAddTask: () => void
}

const mutedText = 'text-[#667085] dark:text-[#a7b0bf]'
const rule = 'border-[#e7eaef] dark:border-[#383838]'

/**
 * Focus sessions (Plus): pick one of today's things and start a calm timer. The running
 * timer itself lives in FocusPanel, so it follows the person across every view.
 */
export function FocusView({ tasks, onFocus, onAddTask }: Props) {
  const { has } = usePlan()
  if (!has('plus')) return <LockedFocus />
  return <FocusList tasks={tasks} onFocus={onFocus} onAddTask={onAddTask} />
}

function FocusList({ tasks, onFocus, onAddTask }: Props) {
  const today = localDate(new Date())
  const current = useCurrentFocus(true)
  const report = useTaskReport('day', today, today)
  const running = current.data ?? null
  const focused = report.data?.focus_minutes ?? null
  const candidates = tasks
    .filter((task) => !task.reminder && !task.done && !!task.due && task.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due) || (a.time ?? '').localeCompare(b.time ?? ''))

  return (
    <div className="max-w-[640px]">
      <p className={`m-0 text-[15px] leading-[1.6] ${mutedText}`}>
        Choose one thing, set a length, and give it your full attention. Focused time adds up in
        Reporting.
      </p>

      <dl className={`m-0 mt-6 flex flex-wrap gap-x-10 gap-y-3 border-y py-4 ${rule}`}>
        <div>
          <dt className={`text-[13px] ${mutedText}`}>Focused today</dt>
          <dd className="m-0 mt-0.5 font-display text-[1.6rem] font-semibold tabular-nums tracking-[-0.02em]">
            {focused === null ? '–' : formatDuration(focused)}
          </dd>
        </div>
        <div>
          <dt className={`text-[13px] ${mutedText}`}>Right now</dt>
          <dd className="m-0 mt-1.5 text-[15px] font-medium">
            {running
              ? `Focusing${running.task_title ? ` on “${running.task_title}”` : ''}`
              : 'No session running'}
          </dd>
        </div>
      </dl>

      <h2 className="m-0 mt-9 text-sm font-semibold">Today&rsquo;s things</h2>
      {candidates.length === 0 ? (
        <div className="mt-3">
          <p className={`m-0 text-sm ${mutedText}`}>
            Nothing is planned for today yet. Add a task with today&rsquo;s date to focus on it.
          </p>
          <button
            type="button"
            onClick={onAddTask}
            className="mt-4 inline-flex min-h-10 cursor-pointer items-center rounded-full border-0 btn-primary px-5 text-[0.85rem] font-bold"
          >
            Add a task for today
          </button>
        </div>
      ) : (
        <ul className="m-0 mt-2 list-none p-0">
          {candidates.map((task) => {
            const isRunning = running?.task_id === task.id
            return (
              <li
                key={task.id}
                className={`flex min-h-[58px] items-center justify-between gap-4 border-b py-2 ${rule}`}
              >
                <div className="min-w-0">
                  <p className="m-0 truncate text-[15px]">{task.title}</p>
                  <p className={`m-0 mt-0.5 text-[12px] ${mutedText}`}>
                    {task.due < today ? 'Overdue' : 'Today'}
                    {task.time && ` · ${task.time}`}
                    {task.project && ` · ${task.project}`}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!!running}
                  aria-label={`Start focus on ${task.title}`}
                  onClick={() => onFocus(task)}
                  className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#d9dee7] bg-transparent px-4 text-[13px] font-semibold text-inherit hover:bg-orange-500/10 hover:text-[#c2410c] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-inherit dark:border-[#484848] dark:hover:text-[#fdba74]"
                >
                  <Timer size={15} aria-hidden="true" />
                  {isRunning ? 'In focus' : 'Focus'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function LockedFocus() {
  return (
    <div className="max-w-[640px]">
      <PlusGate
        plan="plus"
        title="One thing, a quiet timer"
        description="Start a focus session from any task, choose 20 min, 30 min, 1h, or set a custom time, and pause when life happens. Focused time shows up in Reporting."
        preview={
          <div className="grid justify-items-center rounded-lg bg-white px-4 py-6 text-center text-[#1f2937] dark:bg-[#1f1f1f] dark:text-[#f2f2f2]">
            <p className="m-0 text-sm font-semibold">Finish the draft</p>
            <p className="m-0 mt-1 font-display text-[3.2rem] font-semibold leading-none tabular-nums tracking-[-0.03em]">
              25:00
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {FOCUS_PRESETS.map((preset) => (
                <span
                  key={preset}
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
                    preset === 25
                      ? 'bg-[#fed7aa] text-[#9a3412]'
                      : 'border border-[#d9dee7] dark:border-[#484848]'
                  }`}
                >
                  {formatFocusDuration(preset)}
                </span>
              ))}
              <span className="rounded-full border border-[#d9dee7] px-3 py-1 text-[12px] font-semibold dark:border-[#484848]">
                Custom
              </span>
            </div>
          </div>
        }
      />
    </div>
  )
}
