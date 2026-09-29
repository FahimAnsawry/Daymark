import type { CSSProperties, ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Play } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { SiteFooter } from '../components/SiteFooter'
import { GuestOnly } from '../components/GuestOnly'
import { revealDelay, scrollToSection, useReveal } from '../lib/reveal'

interface Principle {
  step: string
  title: string
  body: string
  vignette: ReactNode
}

/*
 * Each principle ends in a small sample of the day sheet, so the three cards read as
 * one flow: loops land, one thing rises, and the evening stays open.
 */
const PRINCIPLES: Principle[] = [
  {
    step: '01',
    title: 'Catch it all',
    body: 'Get every open loop out of your head and somewhere you can trust.',
    vignette: (
      <div className="grid gap-3.5">
        <p className="reveal-rise m-0 rounded-xl bg-white px-5 py-4 text-[0.98rem] text-[#5d6a62] shadow-[0_1px_2px_rgba(31,41,55,0.06)] dark:bg-[#2b2b2b] dark:text-[#c9cfc9] dark:shadow-none">
          Pick up the dry cleaning
        </p>
        <div className="grid grid-cols-2 gap-2.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">
          <span
            className="reveal-land rounded-full bg-[#fed7aa] px-3 py-2.5 text-[0.86rem] text-[#1f2937]"
            style={revealDelay(420)}
          >
            Book dentist
          </span>
          <span
            className="reveal-land rounded-full bg-[#fed7aa] px-3 py-2.5 text-[0.86rem] text-[#1f2937]"
            style={revealDelay(540)}
          >
            Plan the weekend
          </span>
        </div>
      </div>
    ),
  },
  {
    step: '02',
    title: 'Choose what matters',
    body: 'A quiet daily view helps you focus on the next right thing.',
    vignette: (
      <div className="grid gap-3">
        <p
          className="reveal-rise m-0 rounded-xl bg-white px-5 py-3.5 text-[0.98rem] text-[#5d6a62] transition-opacity duration-500 group-hover:opacity-55 dark:bg-[#2b2b2b] dark:text-[#c9cfc9]"
          style={revealDelay(300)}
        >
          Answer emails
        </p>
        <p
          className="reveal-lift m-0 rounded-xl bg-[#c2410c] px-5 py-3.5 text-[0.98rem] font-bold text-white shadow-[0_6px_16px_-6px_rgba(194,65,12,0.55)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          style={revealDelay(560)}
        >
          The one thing: finish the draft
        </p>
        <p
          className="reveal-rise m-0 rounded-xl bg-white px-5 py-3.5 text-[0.98rem] text-[#5d6a62] transition-opacity duration-500 group-hover:opacity-55 dark:bg-[#2b2b2b] dark:text-[#c9cfc9]"
          style={revealDelay(380)}
        >
          Tidy the desk
        </p>
      </div>
    ),
  },
  {
    step: '03',
    title: 'Leave room to live',
    body: 'Plans should support your life, not become another thing to maintain.',
    vignette: (
      <div className="reveal-rise grid min-h-[156px] place-items-center rounded-xl bg-[#183b37] px-5 py-8 text-[1.05rem] leading-[1.5] text-[#f7f6f2] dark:bg-[#183b37]">
        <p className="reveal-fade m-0" style={revealDelay(360)}>
          <span className="tabular-nums">18:40</span>
          <span className="ml-2.5">Room to live</span>
          <br />
          <span className="reveal-fade inline-block text-[#e0ebbd]" style={revealDelay(620)}>
            An evening walk
          </span>
        </p>
      </div>
    ),
  },
]

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const revealRef = useReveal<HTMLElement>()

  return (
    <GuestOnly>
      <div className="overflow-hidden bg-app-background text-[#1f2937] dark:text-[#f3f4f6] transition-colors duration-250">
        <Navbar />

        <main ref={revealRef}>
          <section
            className="relative grid min-h-[750px] md:min-h-[815px] place-items-start md:place-items-center isolate overflow-hidden text-white bg-[#183b37] after:absolute after:-z-10 after:inset-0 after:content-[''] after:bg-[linear-gradient(180deg,rgba(8,27,28,0.38),transparent_45%,rgba(8,27,28,0.45))]"
            aria-labelledby="hero-title"
          >
            <img
              className="absolute -z-20 inset-0 w-full h-full object-cover object-[63%_center] md:object-[54%_center] scale-[1.08] md:scale-[1.015]"
              src="https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=2200&q=85"
              alt="A sunlit desk with an open notebook and a cup of tea"
              width={2200}
              height={1467}
              fetchPriority="high"
            />
            <div className="absolute -z-10 inset-0 bg-[linear-gradient(102deg,rgba(14,49,45,0.9)_0%,rgba(14,49,45,0.62)_36%,rgba(11,36,36,0.08)_74%),linear-gradient(transparent_55%,rgba(11,36,36,0.74))]" />
            <div
              className="w-[min(730px,90vw)] pt-[145px] md:pt-[75px] text-center mx-auto"
              data-reveal="pending"
            >
              <h1
                id="hero-title"
                className="reveal-rise mb-[23px] font-display text-[clamp(2.75rem,10vw,4.25rem)] md:text-[clamp(4.1rem,6vw,5.6rem)] font-semibold tracking-[-0.04em] leading-[1.05] md:leading-[1.04] [&>em]:font-semibold [&>em]:text-[#e0ebbd] dark:[&>em]:text-[#94a3b8] [&>em]:not-italic"
              >
                Plan your day.
                <br />
                <em>Keep your life.</em>
              </h1>
              <p
                className="reveal-rise w-[min(390px,85vw)] mx-auto mb-[30px] text-[0.95rem] md:text-[1.05rem] leading-[1.55] text-white/85"
                style={revealDelay(140)}
              >
                Daymark turns the small things on your mind into a clear, kind plan you can actually
                follow.
              </p>
              <div
                className="reveal-rise flex flex-col md:flex-row justify-center items-center gap-[15px] md:gap-5"
                style={revealDelay(260)}
              >
                <Link
                  className="inline-flex items-center gap-2.5 rounded-full text-[0.85rem] font-bold px-[21px] py-[15px] btn-primary-inverse transition-all duration-200 hover:-translate-y-0.5"
                  to="/register"
                >
                  Start for free <ArrowRight size={17} />
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="inline-flex cursor-pointer items-center gap-2.5 rounded-full text-[0.85rem] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4"
                >
                  <span className="grid place-items-center w-[27px] h-[27px] pl-[2px] border border-white/65 rounded-full">
                    <Play size={11} fill="currentColor" />
                  </span>{' '}
                  See how it works
                </button>
              </div>
              <p
                className="reveal-fade mt-[17px] text-[0.68rem] text-white/60"
                style={revealDelay(420)}
              >
                Free forever for personal use · No credit card
              </p>
            </div>
          </section>

          <PrinciplesSection />

          <section
            className="bg-[#183b37] px-6 py-[96px] text-center text-[#f7f6f2] md:py-[124px] dark:bg-[#111a17]"
            aria-label="Member story"
          >
            <figure className="mx-auto m-0 max-w-[1000px]" data-reveal="pending">
              <blockquote className="reveal-rise m-0 font-display text-[clamp(1.85rem,3.7vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.2] text-balance">
                It’s the first planner that doesn’t treat rest as lost time. When the day is done,
                my evenings feel like mine again.
              </blockquote>
              <figcaption
                className="reveal-fade mt-10 text-[0.95rem] text-[#f7f6f2]/75 md:mt-12"
                style={revealDelay(320)}
              >
                Elena Rostova, Writer and Researcher, Edinburgh
              </figcaption>
            </figure>
          </section>

          <section
            className="bg-[#f7f6f2] px-6 py-[88px] text-center md:py-[104px] dark:bg-app-background"
            aria-labelledby="closing-title"
            data-reveal="pending"
          >
            <h2
              id="closing-title"
              className="reveal-rise m-0 font-display text-[clamp(2.6rem,6.4vw,5.5rem)] font-semibold tracking-[-0.035em] leading-[1.02] text-balance text-[#1f2937] dark:text-[#f2f4ee]"
            >
              Make a little room for your life.
            </h2>
            <Link
              className="reveal-rise group mt-8 inline-flex items-center gap-2.5 rounded-full btn-primary px-9 py-[18px] text-[1.05rem] font-bold transition-all duration-200 hover:-translate-y-0.5 md:mt-7"
              to="/register"
              style={revealDelay(160)}
            >
              Start for free
              <ArrowRight
                size={18}
                className="-ml-1 w-0 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:ml-0 group-hover:w-[18px] group-hover:opacity-100 group-focus-visible:ml-0 group-focus-visible:w-[18px] group-focus-visible:opacity-100"
              />
            </Link>
          </section>
        </main>

        <SiteFooter />
      </div>
    </GuestOnly>
  )
}

/* The intro rises in, then the three cards stagger in with their vignettes. */
function PrinciplesSection() {
  return (
    <section
      className="bg-[#f7f6f2] px-6 pt-[96px] pb-[104px] md:px-[30px] md:pt-[136px] md:pb-[150px] dark:bg-app-background"
      id="how-it-works"
      aria-labelledby="principles-title"
    >
      <div className="mx-auto max-w-[900px] text-center" data-reveal="pending">
        <h2
          id="principles-title"
          className="reveal-rise m-0 font-display text-[clamp(2.3rem,4.6vw,3.6rem)] font-semibold tracking-[-0.035em] leading-[1.08] text-balance text-[#1f2937] dark:text-[#f2f4ee]"
        >
          Your day is more than a list of things to do.
        </h2>
        <p
          className="reveal-rise mx-auto mt-6 max-w-[590px] text-[1.05rem] md:text-[1.15rem] leading-[1.6] text-pretty text-[#727b73] dark:text-[#a7b0bf]"
          style={revealDelay(140)}
        >
          Capture what matters, make room for what doesn’t, and move through your day with a little
          more intention.
        </p>
      </div>

      <ol className="mx-auto mt-16 grid max-w-[1240px] list-none grid-cols-1 gap-5 p-0 md:mt-[72px] md:grid-cols-3 md:gap-6">
        {PRINCIPLES.map((principle, index) => (
          <li
            key={principle.step}
            data-reveal="pending"
            className="reveal-card reveal-rise group flex flex-col rounded-[20px] bg-[#ecebe5] px-7 pt-10 pb-10 text-center md:px-10 md:pt-12 md:pb-14 dark:bg-[#262626]"
            style={{ '--card-index': index } as CSSProperties}
          >
            <span className="text-[0.82rem] font-bold tabular-nums text-[#ea580c] dark:text-[#fb923c]">
              {principle.step}
            </span>
            <h3 className="m-0 mt-3 font-display text-[clamp(1.6rem,2.3vw,2.05rem)] font-semibold tracking-[-0.03em] leading-[1.15] text-[#1f2937] dark:text-[#f2f4ee]">
              {principle.title}
            </h3>
            <p className="mx-auto mt-3.5 mb-0 max-w-[300px] text-[1rem] leading-[1.55] text-[#727b73] dark:text-[#a7b0bf]">
              {principle.body}
            </p>
            <div className="mt-12 md:mt-auto md:pt-[88px]" aria-hidden="true">
              {principle.vignette}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
