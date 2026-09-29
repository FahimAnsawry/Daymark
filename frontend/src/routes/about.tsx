import type { CSSProperties, ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Check, Minus } from 'lucide-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BrandMark } from '../components/BrandMark'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { GuestOnly } from '../components/GuestOnly'
import { revealDelay, scrollToSection, useReveal } from '../lib/reveal'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

// Sample content for the illustrative day sheet and principle cards. It is not user data.
const SHEET_ITEMS = [
  { label: 'Walk before work', done: true },
  { label: 'Finish the proposal draft', done: false },
  { label: 'Call Mum', done: false },
]
const PARKED_ITEMS = ['Renew passport', 'Book dentist', 'Reply to Sam']

const IS_LIST = [
  'A place to catch open loops',
  'A short list for today',
  'Room for rest and people',
]
const ISNT_LIST = [
  'A scoreboard for your hours',
  'A backlog you have to maintain',
  'A reason to feel behind',
]

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b37] dark:focus-visible:outline-[#fed7aa]'

function AboutPage() {
  const revealRef = useReveal<HTMLElement>()

  return (
    <GuestOnly>
      <div className="min-h-screen overflow-x-clip bg-[#f7f6f2] text-[#1f2937] caret-[#ea580c] transition-colors duration-250 selection:bg-[#fed7aa] selection:text-[#1f2937] dark:bg-app-background dark:text-[#f3f4f6]">
        <Navbar variant="light" />

        <main ref={revealRef}>
          <Hero />
          <Principles />
          <IsAndIsnt />
          <Closing />
        </main>

        <SiteFooter />
      </div>
    </GuestOnly>
  )
}

function Hero() {
  return (
    <section className="px-3 md:px-[max(12px,calc(5vw-28px))]" aria-labelledby="about-title">
      <div
        data-reveal="pending"
        className="mx-auto grid max-w-[1320px] items-center gap-12 rounded-[28px] bg-[#e4eadf] px-6 py-14 sm:px-10 md:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-[clamp(48px,7vw,112px)] lg:px-[clamp(40px,5vw,80px)] lg:py-24 dark:bg-[#111a17]"
      >
        <div className="max-w-[620px]">
          <h1
            id="about-title"
            className="reveal-rise m-0 font-display text-[clamp(2.9rem,8.5vw,5.6rem)] font-semibold leading-[0.96] tracking-[-0.035em] text-balance text-[#1f2937] dark:text-[#f2f4ee]"
          >
            A plan, not a scoreboard.
          </h1>
          <p
            className="reveal-rise m-0 mt-7 max-w-[34rem] text-[1.08rem] leading-[1.6] text-[#435249] md:text-[1.2rem] dark:text-[#b4bdb6]"
            style={revealDelay(140)}
          >
            Daymark helps you catch the open loops, choose what matters today, and close the day
            without carrying everything into tomorrow.
          </p>
          <div
            className="reveal-rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4"
            style={revealDelay(260)}
          >
            <Link
              to="/register"
              className={`inline-flex h-12 items-center gap-2 rounded-full btn-primary px-6 text-[0.92rem] font-semibold transition-colors`}
            >
              Start for free <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('principles')}
              className={`cursor-pointer text-[0.92rem] font-semibold text-[#183b37] underline decoration-[#183b37]/30 underline-offset-[6px] transition-colors hover:decoration-[#183b37] dark:text-[#e4eadf] dark:decoration-[#e4eadf]/30 dark:hover:decoration-[#e4eadf] ${focusRing}`}
            >
              What we believe
            </button>
          </div>
        </div>

        <DaySheet />
      </div>
    </section>
  )
}

function DaySheet() {
  return (
    <figure
      className="reveal-lift m-0 w-full max-w-[420px] justify-self-center lg:justify-self-end"
      style={revealDelay(200)}
    >
      <div className="rounded-2xl bg-white p-7 text-[#27352f] shadow-[0_28px_60px_-28px_rgba(24,59,55,0.45),0_2px_6px_rgba(24,59,55,0.06)] sm:p-8 dark:bg-[#262626] dark:text-[#f3f4f6] dark:shadow-[0_28px_60px_-28px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-3 border-b border-[#e6e9e3] pb-5 dark:border-[#383838]">
          <BrandMark animated={false} className="text-[#27352f] dark:text-[#f3f4f6]" />
          <p className="m-0 font-display text-[1.3rem] font-semibold leading-tight tracking-[-0.03em]">
            Today
          </p>
        </div>

        <p className="m-0 mt-5 mb-2 text-[0.8rem] font-semibold text-[#5d6a62] dark:text-[#a7b0bf]">
          Three things
        </p>
        <ul className="m-0 grid list-none gap-1 p-0">
          {SHEET_ITEMS.map((item) => (
            <li key={item.label} className="flex min-h-10 items-center gap-3 py-1.5 text-[1rem]">
              <span
                aria-hidden="true"
                className={`grid size-5 shrink-0 place-items-center rounded-[6px] border ${
                  item.done
                    ? 'border-[#183b37] bg-[#183b37] text-white dark:border-[#fed7aa] dark:bg-[#fed7aa] dark:text-[#1f2937]'
                    : 'border-[#8a958d] dark:border-[#6b7280]'
                }`}
              >
                {item.done && <Check size={13} strokeWidth={3} />}
              </span>
              <span className={`relative ${item.done ? 'text-[#6b746c] dark:text-[#8b929c]' : ''}`}>
                {item.label}
                {item.done && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-1/2 h-px origin-left animate-strip-fill bg-current [animation-delay:500ms]"
                  />
                )}
              </span>
              <span className="sr-only">{item.done ? '(done)' : '(to do)'}</span>
            </li>
          ))}
        </ul>

        <p className="m-0 mt-5 rounded-xl bg-[#183b37] px-5 py-4 font-display text-[1.05rem] font-medium tracking-[-0.02em] text-white">
          <span className="text-[#fed7aa]">Room to live</span>
          <span aria-hidden="true" className="px-2 text-white/50">
            ·
          </span>
          A long walk
        </p>

        <p className="m-0 mt-6 mb-2 text-[0.8rem] font-semibold text-[#5d6a62] dark:text-[#a7b0bf]">
          Parked for later
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {PARKED_ITEMS.map((item) => (
            <li
              key={item}
              className="rounded-full bg-[#f1f3ee] px-3 py-1 text-[0.82rem] text-[#5d6a62] dark:bg-[#313131] dark:text-[#c5cec7]"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-5 text-center text-[0.8rem] text-[#435249] dark:text-[#a7b0bf]">
        A sample day in Daymark
      </figcaption>
    </figure>
  )
}

function Principles() {
  return (
    <section
      id="principles"
      className="mx-auto max-w-[1320px] scroll-mt-6 px-5.5 pt-24 pb-20 md:px-[5vw] md:pt-36 md:pb-28"
      aria-labelledby="principles-title"
    >
      <div
        className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-end md:gap-[clamp(40px,8vw,120px)]"
        data-reveal="pending"
      >
        <h2
          id="principles-title"
          className="reveal-rise m-0 max-w-[14ch] font-display text-[clamp(2.4rem,5.6vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance text-[#1f2937] dark:text-[#f2f4ee]"
        >
          Useful, kind, and quietly intentional.
        </h2>
        <p
          className="reveal-rise m-0 max-w-[36rem] text-[1.02rem] leading-[1.7] text-[#5d6a62] dark:text-[#a7b0bf]"
          style={revealDelay(140)}
        >
          Productivity had become another thing to keep up with. We wanted a daily tool that felt
          more like a steady hand than a scoreboard, and we hold it to three ideas.
        </p>
      </div>

      <ul className="m-0 mt-14 grid list-none gap-5 p-0 md:mt-20 lg:grid-cols-3 lg:gap-6">
        <PrincipleCard
          index={0}
          title="Clarity before complexity"
          body="We start by reducing mental noise. Every feature should make the next right thing easier to see."
        >
          <ClarityVignette />
        </PrincipleCard>
        <PrincipleCard
          index={1}
          title="Life is part of the plan"
          body="Rest, relationships, and ordinary moments are not distractions from a productive day."
        >
          <LifeVignette />
        </PrincipleCard>
        <PrincipleCard
          index={2}
          title="Finish with less to carry"
          body="A good day can end unfinished. What matters is knowing what can wait, and letting it."
        >
          <CarryVignette />
        </PrincipleCard>
      </ul>
    </section>
  )
}

function PrincipleCard({
  index,
  title,
  body,
  children,
}: {
  index: number
  title: string
  body: string
  children: ReactNode
}) {
  return (
    <li
      data-reveal="pending"
      className="reveal-card reveal-rise group flex flex-col rounded-2xl bg-white p-7 sm:p-8 dark:bg-[#262626]"
      style={{ '--card-index': index } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="flex min-h-[168px] items-center rounded-xl bg-[#f1f3ee] p-5 dark:bg-[#1c1c1c]"
      >
        {children}
      </div>
      <h3 className="m-0 mt-8 font-display text-[1.55rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[#1f2937] dark:text-[#f2f4ee]">
        {title}
      </h3>
      <p className="m-0 mt-3 text-[0.98rem] leading-[1.65] text-[#5d6a62] dark:text-[#a7b0bf]">
        {body}
      </p>
    </li>
  )
}

// Many faint open loops settle into one clear next step. On hover the noise recedes
// and the next step comes forward.
function ClarityVignette() {
  return (
    <div className="grid w-full gap-2.5">
      {['w-4/5', 'w-3/5', 'w-2/3'].map((width, i) => (
        <span
          key={width}
          className={`reveal-fade h-2 origin-left rounded-full bg-[#d4dbd2] transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-[0.8] group-hover:opacity-45 dark:bg-[#383838] ${width}`}
          style={{ ...revealDelay(300 + i * 90), transitionDelay: `${i * 60}ms` }}
        />
      ))}
      <span
        style={revealDelay(620)}
        className="reveal-lift mt-1.5 inline-flex w-fit origin-left items-center gap-2 rounded-full bg-[#183b37] py-1.5 pr-4 pl-2 text-[0.84rem] font-semibold text-white transition-[scale,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-hover:shadow-[0_6px_16px_-6px_rgba(24,59,55,0.55)] dark:bg-[#fed7aa] dark:text-[#1f2937] dark:group-hover:shadow-[0_6px_16px_-6px_rgba(254,215,170,0.35)]"
      >
        <span className="grid size-5 place-items-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 dark:bg-[#1f2937]/10">
          <ArrowRight size={12} strokeWidth={2.5} />
        </span>
        Finish the proposal draft
      </span>
    </div>
  )
}

// The day's plan holds people and rest alongside tasks.
function LifeVignette() {
  return (
    <div className="grid w-full gap-2">
      <span
        className="reveal-rise flex items-center gap-2.5 text-[0.86rem] text-[#5d6a62] dark:text-[#a7b0bf]"
        style={revealDelay(300)}
      >
        <span className="size-3.5 rounded-[4px] border border-[#8a958d] dark:border-[#6b7280]" />
        Send the invoice
      </span>
      <span
        style={revealDelay(560)}
        className="reveal-lift rounded-lg bg-[#183b37] px-3.5 py-2.5 font-display text-[0.95rem] font-medium tracking-[-0.02em] text-white"
      >
        <span className="text-[#fed7aa]">Room to live</span>
        <span className="px-1.5 text-white/50">·</span>
        Call Mum, 7pm
      </span>
      <span
        className="reveal-rise flex items-center gap-2.5 text-[0.86rem] text-[#5d6a62] dark:text-[#a7b0bf]"
        style={revealDelay(380)}
      >
        <span className="size-3.5 rounded-[4px] border border-[#8a958d] dark:border-[#6b7280]" />
        Pick up groceries
      </span>
    </div>
  )
}

// Unfinished things are parked on purpose, not dragged along.
function CarryVignette() {
  return (
    <div className="grid w-full gap-3">
      <span
        className="reveal-fade text-[0.78rem] font-semibold text-[#5d6a62] dark:text-[#a7b0bf]"
        style={revealDelay(300)}
      >
        Parked for later
      </span>
      <span className="flex flex-wrap gap-2">
        {PARKED_ITEMS.map((item, i) => (
          <span
            key={item}
            style={revealDelay(420 + i * 110)}
            className="reveal-land rounded-full bg-white px-3 py-1 text-[0.8rem] text-[#5d6a62] dark:bg-[#313131] dark:text-[#c5cec7]"
          >
            {item}
          </span>
        ))}
      </span>
    </div>
  )
}

function IsAndIsnt() {
  return (
    <section
      className="mx-auto max-w-[1320px] px-5.5 pb-24 md:px-[5vw] md:pb-36"
      aria-labelledby="is-isnt-title"
    >
      <h2
        id="is-isnt-title"
        data-reveal="pending"
        className="reveal-rise m-0 font-display text-[clamp(2rem,4.2vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance text-[#1f2937] dark:text-[#f2f4ee]"
      >
        What Daymark is, and isn’t.
      </h2>
      <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2 lg:gap-6">
        <ComparisonPanel
          index={0}
          title="Daymark is"
          items={IS_LIST}
          icon={<Check size={15} strokeWidth={2.5} />}
          className="bg-[#e4eadf] dark:bg-[#111a17]"
          markClassName="bg-[#183b37] text-white dark:bg-[#e4eadf] dark:text-[#183b37]"
        />
        <ComparisonPanel
          index={1}
          title="Daymark isn’t"
          items={ISNT_LIST}
          icon={<Minus size={15} strokeWidth={2.5} />}
          className="bg-[#fed7aa] dark:bg-[#fed7aa]/10"
          markClassName="bg-[#1f2937]/10 text-[#7c2d12] dark:bg-[#fed7aa]/15 dark:text-[#fed7aa]"
        />
      </div>
    </section>
  )
}

function ComparisonPanel({
  index,
  title,
  items,
  icon,
  className,
  markClassName,
}: {
  index: number
  title: string
  items: string[]
  icon: ReactNode
  className: string
  markClassName: string
}) {
  return (
    <div
      data-reveal="pending"
      className={`reveal-card reveal-rise rounded-2xl p-7 sm:p-10 ${className}`}
      style={{ '--card-index': index } as CSSProperties}
    >
      <h3 className="m-0 font-display text-[1.45rem] font-semibold tracking-[-0.03em] text-[#1f2937] dark:text-[#f2f4ee]">
        {title}
      </h3>
      <ul className="m-0 mt-6 grid list-none gap-4 p-0">
        {items.map((item, i) => (
          <li
            key={item}
            style={revealDelay(240 + i * 90)}
            className="reveal-rise flex items-center gap-3.5 text-[1.05rem] text-[#1f2937] md:text-[1.12rem] dark:text-[#e5e7eb]"
          >
            <span
              aria-hidden="true"
              className={`grid size-7 shrink-0 place-items-center rounded-full ${markClassName}`}
            >
              {icon}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Closing() {
  return (
    <section
      className="bg-[#183b37] text-white dark:bg-[#183b37]"
      aria-labelledby="about-closing-title"
    >
      <div className="mx-auto max-w-[1320px] px-5.5 md:px-[5vw]">
        <div
          className="flex flex-col items-start justify-between gap-10 py-20 md:flex-row md:items-end md:py-28"
          data-reveal="pending"
        >
          <div>
            <h2
              id="about-closing-title"
              className="reveal-rise m-0 max-w-[12ch] font-display text-[clamp(2.8rem,7vw,5.4rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance text-[#f7f6f2]"
            >
              Make room for what matters.
            </h2>
            <p
              className="reveal-fade m-0 mt-6 text-[1rem] text-[#e4eadf]/80"
              style={revealDelay(200)}
            >
              That is the whole brief.
            </p>
          </div>
          <Link
            to="/register"
            style={revealDelay(300)}
            className="reveal-rise inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full btn-primary-inverse px-7 text-[0.95rem] font-semibold transition-colors"
          >
            Start for free <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
