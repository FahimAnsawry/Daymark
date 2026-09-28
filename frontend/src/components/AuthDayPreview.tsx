import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { BrandMark } from './BrandMark'

interface AuthDayPreviewProps {
  mode: 'login' | 'register'
}

// Sample content for the preview sheet. It illustrates a day in Daymark; it is not user data.
const TODAY_ITEMS = ['Walk before work', 'Finish the proposal draft', 'Call Mum']
const PARKED_ITEMS = ['Renew passport', 'Book dentist', 'Reply to Sam']

const STEP_INTERVAL_MS = 2600
// One extra beat with the sheet complete before it quietly resets.
const LOOP_STEPS = TODAY_ITEMS.length + 2

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * The live Daymark day sheet beside the auth form. On sign in, today's items check off one
 * by one; on sign up, the three things are written in one by one, as a plan being set up.
 */
export function AuthDayPreview({ mode }: AuthDayPreviewProps) {
  const reducedMotion = usePrefersReducedMotion()
  const isRegister = mode === 'register'
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (reducedMotion) return
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % LOOP_STEPS)
    }, STEP_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [reducedMotion])

  const progress = Math.min(step, TODAY_ITEMS.length)
  // Sign up fills the list in; sign in checks it off. Reduced motion shows a settled state.
  const writtenCount = isRegister
    ? reducedMotion
      ? TODAY_ITEMS.length
      : progress
    : TODAY_ITEMS.length
  const checkedCount = isRegister ? 0 : reducedMotion ? 1 : progress

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date()),
    [],
  )

  return (
    <figure
      className="relative m-0 w-full max-w-[460px] xl:max-w-[540px]"
      aria-label="A sample day in Daymark"
    >
      <div className="rounded-2xl bg-white p-7 text-[#27352f] shadow-[0_28px_60px_-28px_rgba(24,59,55,0.45),0_2px_6px_rgba(24,59,55,0.06)] xl:p-9 dark:bg-[#262626] dark:text-[#f3f4f6] dark:shadow-[0_28px_60px_-28px_rgba(0,0,0,0.7)]">
        <header className="flex items-center gap-3 pb-5 border-b border-[#e6e9e3] dark:border-[#383838]">
          <BrandMark animated={false} className="text-[#27352f] dark:text-[#f3f4f6]" />
          <p className="m-0 font-display text-[1.3rem] font-semibold tracking-[-0.03em] leading-tight xl:text-[1.5rem]">
            {dateLabel}
          </p>
        </header>

        <section className="pt-5" aria-label="Today">
          <h2 className="m-0 mb-3 text-[0.78rem] font-semibold text-[#5d6a62] xl:text-[0.84rem] dark:text-[#a7b0bf]">
            {isRegister ? 'Your first three things' : 'Three things today'}
          </h2>
          <ul className="m-0 p-0 grid gap-1 list-none">
            {TODAY_ITEMS.map((item, index) => {
              const written = index < writtenCount
              const done = index < checkedCount
              return (
                <li
                  key={item}
                  className="flex min-h-10 items-center gap-3 py-2 text-[0.98rem] xl:text-[1.05rem]"
                >
                  <span
                    aria-hidden="true"
                    className={`grid place-items-center size-[20px] shrink-0 rounded-[6px] border transition-colors duration-300 ${
                      done
                        ? 'border-[#183b37] bg-[#183b37] text-[#FFFFFF] dark:border-[#fed7aa] dark:bg-[#fed7aa] dark:text-[#1f2937]'
                        : written
                          ? 'border-[#8a958d] bg-transparent text-transparent dark:border-[#6b7280]'
                          : 'border-[#d4dbd2] bg-transparent text-transparent dark:border-[#424242]'
                    }`}
                  >
                    <Check
                      size={13}
                      strokeWidth={3}
                      className={`transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${done ? 'scale-100' : 'scale-0'}`}
                    />
                  </span>
                  {written ? (
                    <span
                      key={`${item}-${written}`}
                      className={`relative transition-colors duration-300 ${
                        done ? 'text-[#6b746c] dark:text-[#8b929c]' : ''
                      } ${isRegister && !reducedMotion ? 'animate-sheet-item-in' : ''}`}
                    >
                      {item}
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 right-0 top-1/2 h-px origin-left bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          done ? 'scale-x-100' : 'scale-x-0'
                        }`}
                      />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="h-px w-2/5 self-end mb-[0.55em] bg-[#c7cfc2] dark:bg-[#424242]"
                    />
                  )}
                  <span className="sr-only">
                    {!written ? '(not written yet)' : done ? '(done)' : '(to do)'}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <p
          className="m-0 mt-5 rounded-xl bg-[#183b37] px-5 py-4 font-display text-[1.08rem] font-medium tracking-[-0.02em] text-[#FFFFFF] xl:text-[1.15rem]"
          aria-label="Room to live: Dinner with Priya, 7pm"
        >
          <span className="text-[#fed7aa]">Room to live</span>
          <span aria-hidden="true" className="px-2 text-[#FFFFFF]/50">
            ·
          </span>
          Dinner with Priya, 7pm
        </p>

        <section className="mt-6" aria-label="Parked for later">
          <h2 className="m-0 mb-2 text-[0.78rem] font-semibold text-[#5d6a62] xl:text-[0.84rem] dark:text-[#a7b0bf]">
            Parked for later
          </h2>
          <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
            {PARKED_ITEMS.map((item) => (
              <li
                key={item}
                className="rounded-full bg-[#f1f3ee] px-3 py-1 text-[0.8rem] text-[#5d6a62] xl:text-[0.86rem] dark:bg-[#313131] dark:text-[#c5cec7]"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <figcaption className="mt-6 text-center text-[0.78rem] text-[#435249] dark:text-[#a7b0bf]">
        A sample day in Daymark
      </figcaption>
    </figure>
  )
}
