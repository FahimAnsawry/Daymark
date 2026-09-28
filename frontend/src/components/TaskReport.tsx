import { Lock } from 'lucide-react'
import { useState } from 'react'
import { usePlan } from '../lib/auth-context'
import { formatDuration } from '../lib/calendar'
import { localDate, useTaskReport, type TaskReport as Report } from '../lib/tasks'
import { PlusGate } from './PlusGate'

type Group = 'day' | 'week'

/** Report ranges. Only the last week is free; longer views are part of Pro. */
const RANGES = [
  { id: '7d', label: 'Last 7 days', period: 'last 7 days', group: 'day', daysBack: 6, pro: false },
  { id: '14d', label: '14 days', period: 'last 14 days', group: 'day', daysBack: 13, pro: true },
  { id: '8w', label: '8 weeks', period: 'last 8 weeks', group: 'week', daysBack: 7 * 7, pro: true },
  {
    id: '6m',
    label: '6 months',
    period: 'last 6 months',
    group: 'week',
    daysBack: 7 * 25,
    pro: true,
  },
] as const

type Range = (typeof RANGES)[number]

/** The API aligns weekly ranges to Monday. */
function datesFor(range: Range) {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - range.daysBack)
  return { from: localDate(from), to: localDate(to) }
}

const shortDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const bucketLabel = (start: string, group: Group) =>
  group === 'day'
    ? new Date(`${start}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : `Week of ${shortDate(start)}`
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const mutedText = 'text-[#667085] dark:text-[#a7b0bf]'
const rule = 'border-[#d9dee7] dark:border-[#383838]'

export function TaskReport() {
  const { has } = usePlan()
  const isPro = has('pro')
  const [rangeId, setRangeId] = useState<Range['id']>(isPro ? '14d' : '7d')
  const range = RANGES.find((option) => option.id === rangeId) ?? RANGES[0]
  const isLocked = range.pro && !isPro
  const { from, to } = datesFor(range)
  const report = useTaskReport(range.group, from, to, !isLocked)

  return (
    <div className="max-w-[680px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-[15px] ${mutedText}`}>Completed tasks</p>
        <div
          role="group"
          aria-label="Report range"
          className={`inline-flex flex-wrap rounded-full border p-[3px] ${rule}`}
        >
          {RANGES.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={rangeId === option.id}
              onClick={() => setRangeId(option.id)}
              className={`cursor-pointer rounded-full border-0 px-[14px] py-[5px] text-[13px] transition-colors duration-150 motion-reduce:transition-none ${
                rangeId === option.id ? 'btn-primary' : `bg-transparent ${mutedText}`
              }`}
            >
              {option.label}
              {option.pro && !isPro && (
                <>
                  <Lock
                    size={11}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="ml-1.5 inline-block -translate-y-px align-middle"
                  />
                  <span className="sr-only"> (Pro)</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLocked ? (
        <PlusGate
          plan="pro"
          title={`See your ${range.period}`}
          description="Look back further, notice the rhythm of your weeks, and get a gentle recap every Sunday evening."
        />
      ) : report.isPending ? (
        <p className={`mt-8 text-sm ${mutedText}`} role="status">
          Loading your report…
        </p>
      ) : report.isError ? (
        <div className="mt-8 text-sm">
          <p>We couldn't load your report.</p>
          <button
            type="button"
            className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-orange-700 underline dark:text-orange-300"
            onClick={() => void report.refetch()}
          >
            Try again
          </button>
        </div>
      ) : (
        <ReportBody report={report.data} group={range.group} period={range.period} />
      )}
    </div>
  )
}

function ReportBody({ report, group, period }: { report: Report; group: Group; period: string }) {
  const max = Math.max(1, ...report.buckets.map((bucket) => bucket.completed))
  const stats = [
    { value: report.totals.completed, label: `Completed, ${period}` },
    { value: report.totals.open, label: 'Open' },
    { value: report.totals.overdue, label: 'Overdue' },
    ...(report.streak === null ? [] : [{ value: report.streak, label: 'Days in a row' }]),
    ...(report.focus_minutes === null
      ? []
      : [{ value: formatDuration(report.focus_minutes), label: 'Focused' }]),
  ]
  const columns =
    stats.length >= 4
      ? `${stats.length === 5 ? 'grid-cols-5' : 'grid-cols-4'} max-[640px]:grid-cols-2`
      : 'grid-cols-3'

  return (
    <>
      <div className={`my-5 grid border-y ${rule} ${columns}`}>
        {stats.map((stat) => (
          <div key={stat.label} className={`border-r px-4 py-6 last:border-r-0 ${rule}`}>
            <strong className="block text-[32px] max-[900px]:text-[26px]">{stat.value}</strong>
            <span className={`mt-1.5 block text-[13px] ${mutedText}`}>{stat.label}</span>
          </div>
        ))}
      </div>

      <figure className="m-0 mt-8">
        <figcaption className="mb-3 text-sm font-medium">Tasks completed per {group}</figcaption>
        {report.totals.completed === 0 ? (
          <p className={`text-sm ${mutedText}`}>
            Nothing completed in the {period} yet. Finished tasks will show up here.
          </p>
        ) : (
          <>
            <div aria-hidden="true" className={`flex h-40 items-end gap-[2px] border-b ${rule}`}>
              {report.buckets.map((bucket) => (
                <div
                  key={bucket.start}
                  className="group relative flex h-full flex-1 items-end justify-center"
                >
                  <div
                    className="w-full max-w-9 rounded-t-[4px] bg-[#c2410c] dark:bg-[#ea580c]"
                    style={{ height: `${(bucket.completed / max) * 100}%` }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1f2937] px-2 py-1 text-xs text-white shadow group-hover:block dark:bg-[#f3f4f6] dark:text-[#1f2937]">
                    {bucketLabel(bucket.start, group)}: {plural(bucket.completed, 'task')}
                  </div>
                </div>
              ))}
            </div>
            <div
              className={`mt-2 flex justify-between text-[11px] ${mutedText}`}
              aria-hidden="true"
            >
              <span>{shortDate(report.buckets[0]?.start ?? report.from)}</span>
              <span>Peak {plural(max, 'task')}</span>
              <span>{group === 'day' ? 'Today' : 'This week'}</span>
            </div>
            <table className="sr-only">
              <caption>Tasks completed per {group}</caption>
              <thead>
                <tr>
                  <th scope="col">{group === 'day' ? 'Day' : 'Week'}</th>
                  <th scope="col">Completed</th>
                </tr>
              </thead>
              <tbody>
                {report.buckets.map((bucket) => (
                  <tr key={bucket.start}>
                    <th scope="row">{bucketLabel(bucket.start, group)}</th>
                    <td>{bucket.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </figure>

      {report.by_project.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-sm font-medium">By project</h3>
          <ul className={`m-0 list-none border-t p-0 ${rule}`}>
            {report.by_project.map((row) => (
              <li
                key={row.project || '(none)'}
                className={`flex justify-between border-b py-2.5 text-sm ${rule}`}
              >
                <span>{row.project || 'No project'}</span>
                <span className={mutedText}>{plural(row.completed, 'task')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
