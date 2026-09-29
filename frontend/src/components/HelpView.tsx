import { Mail, Plus, Search, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { TRIAL_DAYS } from '../lib/plans'

const TOPICS = ['Planning', 'Reminders', 'Sharing', 'Plans and billing'] as const
type Topic = (typeof TOPICS)[number]

type Question = { id: string; topic: Topic; question: string; answer: string }

const QUESTIONS: Question[] = [
  {
    id: 'today-upcoming',
    topic: 'Planning',
    question: 'What is the difference between Today and Upcoming?',
    answer:
      'Today shows everything due today, plus what you finished today. Upcoming shows tasks with a later date, laid out on a calendar.',
  },
  {
    id: 'repeating',
    topic: 'Planning',
    question: 'How do repeating tasks work?',
    answer:
      'Choose daily, weekly or monthly when you add a task with a date. When you complete it, the task moves to its next date instead of closing, and every completion still counts in Reporting.',
  },
  {
    id: 'delete-project',
    topic: 'Planning',
    question: 'What happens when I delete a project?',
    answer:
      'The project’s tasks are deleted with it. To keep a task, move it to another project first.',
  },
  {
    id: 'focus',
    topic: 'Planning',
    question: 'How do focus sessions work?',
    answer:
      'Focus sessions are part of Plus. Pick one of today’s tasks, choose 20 min, 30 min, 1h or a custom length, and pause when life happens. Focused time adds up in Reporting.',
  },
  {
    id: 'reminders',
    topic: 'Reminders',
    question: 'How do reminders and quiet hours work?',
    answer:
      'Reminders are part of Plus. Set a time on a task and you get a nudge on this device and by email. Nothing is sent during your quiet hours; a reminder that falls inside them waits until they end.',
  },
  {
    id: 'notifications',
    topic: 'Reminders',
    question: 'Why am I not getting notifications on this device?',
    answer:
      'Open Reminders and choose Allow notifications. If your browser has blocked them, allow notifications for Daymark in the site settings, then reload the page.',
  },
  {
    id: 'share-who',
    topic: 'Sharing',
    question: 'Who can I share a project with?',
    answer:
      'With Pro, invite a partner, family member or small team by email. They can see, add, finish and assign tasks in that project. A project shared with you stays open to you on any plan.',
  },
  {
    id: 'share-stop',
    topic: 'Sharing',
    question: 'How do I remove someone or cancel an invitation?',
    answer:
      'Open Shared projects, choose Manage next to the project, then remove the person or cancel their pending invitation.',
  },
  {
    id: 'trial',
    topic: 'Plans and billing',
    question: 'How does the free trial work?',
    answer: `Plus and Pro start with a ${TRIAL_DAYS}-day free trial. You aren’t charged during the trial, and you can cancel any time before it ends.`,
  },
  {
    id: 'cancel',
    topic: 'Plans and billing',
    question: 'How do I cancel my plan?',
    answer:
      'Open Settings, then Billing, and choose Cancel plan. You keep access until the end of your current period, then move to Free. Your tasks stay just as they are.',
  },
]

const mutedText = 'text-[#667085] dark:text-[#a7b0bf]'
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:focus-visible:outline-[#fed7aa]'

/**
 * Help & resources: search first, then real questions in an accordion filtered by topic,
 * with a way to write to us at the end.
 */
export function HelpView() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [openId, setOpenId] = useState<string | null>(QUESTIONS[0].id)
  const baseId = useId()

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return QUESTIONS.filter((item) => {
      if (topic && item.topic !== topic) return false
      const haystack = `${item.question} ${item.answer}`.toLowerCase()
      return words.every((word) => haystack.includes(word))
    })
  }, [query, topic])

  return (
    <div className="max-w-[720px] pb-10">
      <div
        role="search"
        className="flex min-h-14 items-center gap-3 rounded-full border border-[#d9dee7] bg-white px-5 transition-shadow duration-150 focus-within:shadow-[0_0_0_2px_#c2410c] motion-reduce:transition-none dark:border-[#383838] dark:bg-[#262626] dark:focus-within:shadow-[0_0_0_2px_#fdba74]"
      >
        <Search size={19} className={`shrink-0 ${mutedText}`} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search questions, like repeating tasks"
          aria-label="Search help questions"
          className="min-w-0 flex-1 border-0 bg-transparent text-base text-[#1f2937] outline-none placeholder:text-[#667085] dark:text-[#f3f4f6] dark:placeholder:text-[#a7b0bf] [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery('')}
            className={`grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent ${mutedText} hover:text-[#1f2937] dark:hover:text-white ${focusRing}`}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
        {[null, ...TOPICS].map((item) => {
          const selected = topic === item
          return (
            <button
              key={item ?? 'all'}
              type="button"
              aria-pressed={selected}
              onClick={() => setTopic(item)}
              className={`min-h-9 cursor-pointer rounded-full border px-4 text-sm font-medium ${focusRing} ${
                selected
                  ? 'btn-primary border-[#c2410c] dark:border-[#fed7aa]'
                  : 'border-[#d9dee7] bg-white text-[#1f2937] hover:border-[#c2410c] dark:border-[#383838] dark:bg-[#262626] dark:text-[#f3f4f6] dark:hover:border-[#fdba74]'
              }`}
            >
              {item ?? 'All'}
            </button>
          )
        })}
      </div>

      <p className="sr-only" role="status">
        {results.length === 1 ? '1 answer found' : `${results.length} answers found`}
      </p>

      {results.length > 0 ? (
        <ul className="m-0 mt-6 grid list-none gap-2.5 p-0">
          {results.map((item) => {
            const open = openId === item.id
            const buttonId = `${baseId}-${item.id}-q`
            const panelId = `${baseId}-${item.id}-a`
            return (
              <li
                key={item.id}
                className="rounded-xl border border-[#d9dee7] bg-white dark:border-[#383838] dark:bg-[#262626]"
              >
                <h3 className="m-0">
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenId(open ? null : item.id)}
                    className={`flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 rounded-xl border-0 bg-transparent px-5 py-3 text-left font-sans text-[17px] font-semibold text-[#1f2937] dark:text-[#f3f4f6] ${focusRing}`}
                  >
                    <span className="text-pretty">{item.question}</span>
                    <Plus
                      size={20}
                      aria-hidden="true"
                      className={`shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${mutedText} ${open ? 'rotate-45' : ''}`}
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p
                      className={`m-0 max-w-[62ch] px-5 pb-5 text-[15px] leading-[1.6] ${mutedText}`}
                    >
                      {item.answer}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-[#d9dee7] px-5 py-8 text-center dark:border-[#383838]">
          <p className="m-0 font-display text-lg font-semibold">
            Nothing matches &ldquo;{query.trim() || topic}&rdquo;
          </p>
          <p className={`m-0 mt-1.5 text-[15px] ${mutedText}`}>
            Try another word, or write to us below.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setTopic(null)
            }}
            className={`mt-4 min-h-9 cursor-pointer rounded-full border border-[#d9dee7] bg-transparent px-4 text-sm font-semibold text-inherit hover:bg-orange-500/10 dark:border-[#484848] ${focusRing}`}
          >
            Show all questions
          </button>
        </div>
      )}

      <section
        aria-labelledby={`${baseId}-contact`}
        className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-2xl border border-[#d5dccf] bg-[#e4eadf] px-6 py-5 text-[#27352f] dark:border-[#2c3a35] dark:bg-[#111a17] dark:text-[#f3f4f6]"
      >
        <div className="min-w-0">
          <h3 id={`${baseId}-contact`} className="m-0 text-[17px] font-semibold">
            Still stuck? Write to hello@daymark.app
          </h3>
          <p className="m-0 mt-1 text-[14px] text-[#4f5f56] dark:text-[#a7b0bf]">
            Tell us what you were doing and what you expected. Pro includes priority help.
          </p>
        </div>
        <a
          href="mailto:hello@daymark.app?subject=Daymark%20help"
          className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border-0 btn-primary px-5 text-sm font-bold no-underline ${focusRing}`}
        >
          <Mail size={16} aria-hidden="true" /> Email us
        </a>
      </section>
    </div>
  )
}
